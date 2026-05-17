import os
import yt_dlp
import requests
from flask import Flask, request, redirect, session, jsonify, render_template, Response, stream_with_context
from spotipy.oauth2 import SpotifyOAuth
from ytmusicapi import YTMusic
import spotipy

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "change-me-in-production")
app.config["SESSION_COOKIE_NAME"] = "musicfy_session"

# Spotify OAuth configuration — values come from environment variables
SPOTIFY_SCOPE = "user-library-read playlist-read-private"

def _get_sp_oauth():
    """Build a fresh SpotifyOAuth instance using current env vars."""
    return SpotifyOAuth(
        client_id=os.environ["SPOTIPY_CLIENT_ID"],
        client_secret=os.environ["SPOTIPY_CLIENT_SECRET"],
        redirect_uri=os.environ["SPOTIPY_REDIRECT_URI"],
        scope=SPOTIFY_SCOPE,
        cache_path=None,        # never cache tokens on disk
        show_dialog=True,
    )

def _get_spotify_client():
    """
    Return an authenticated Spotify client from the token stored in the session.
    Refreshes the access token automatically if it has expired.
    Raises RuntimeError when no token exists (user must log in).
    """
    token_info = session.get("token_info")
    if not token_info:
        raise RuntimeError("not_logged_in")

    sp_oauth = _get_sp_oauth()

    # Refresh the token if it is expired
    if sp_oauth.is_token_expired(token_info):
        token_info = sp_oauth.refresh_access_token(token_info["refresh_token"])
        session["token_info"] = token_info

    return spotipy.Spotify(auth=token_info["access_token"])


# ---------------------------------------------------------------------------
# Authentication routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    """Serve the main player page."""
    logged_in = "token_info" in session
    return render_template("index.html", logged_in=logged_in)


@app.route("/login")
def login():
    """Redirect the user to Spotify's OAuth authorisation page."""
    sp_oauth = _get_sp_oauth()
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)


@app.route("/callback")
def callback():
    """
    Spotify redirects here after the user grants (or denies) permission.
    Exchange the temporary code for a long-lived access/refresh token pair.
    """
    code = request.args.get("code")
    error = request.args.get("error")

    if error or not code:
        return f"<h3>Login failed: {error or 'No code returned'}</h3><a href='/'>Back</a>", 400

    sp_oauth = _get_sp_oauth()
    token_info = sp_oauth.get_access_token(code, as_dict=True)
    session["token_info"] = token_info
    return redirect("/")


@app.route("/logout")
def logout():
    """Clear the session so the user is effectively logged out."""
    session.clear()
    return redirect("/")


# ---------------------------------------------------------------------------
# Spotify data routes
# ---------------------------------------------------------------------------

@app.route("/get_playlists")
def get_playlists():
    """
    Return a JSON list of the user's Spotify playlists, each containing
    a selection of tracks (name + artist).
    """
    try:
        sp = _get_spotify_client()
    except RuntimeError:
        return jsonify({"error": "not_logged_in"}), 401

    try:
        results = sp.current_user_playlists(limit=20)
        playlists = []

        for item in results.get("items", []):
            if not item:
                continue

            playlist_id = item["id"]
            playlist_name = item["name"]

            # Fetch up to 50 tracks per playlist
            tracks_result = sp.playlist_tracks(playlist_id, limit=50)
            tracks = []
            for track_item in tracks_result.get("items", []):
                track = track_item.get("track")
                if not track or not track.get("name"):
                    continue
                artist_names = ", ".join(a["name"] for a in track.get("artists", []))
                tracks.append({"name": track["name"], "artist": artist_names})

            playlists.append({"id": playlist_id, "name": playlist_name, "tracks": tracks})

        return jsonify(playlists)

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/get_liked_songs")
def get_liked_songs():
    """Return the user's Liked Songs library (up to 50 tracks)."""
    try:
        sp = _get_spotify_client()
    except RuntimeError:
        return jsonify({"error": "not_logged_in"}), 401

    try:
        results = sp.current_user_saved_tracks(limit=50)
        tracks = []
        for item in results.get("items", []):
            track = item.get("track")
            if not track or not track.get("name"):
                continue
            artist_names = ", ".join(a["name"] for a in track.get("artists", []))
            tracks.append({"name": track["name"], "artist": artist_names})

        return jsonify({"name": "Liked Songs", "tracks": tracks})

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ---------------------------------------------------------------------------
# YouTube Music stream-URL bridge
# ---------------------------------------------------------------------------

# Initialise YTMusic without authentication — public search is sufficient
ytmusic = YTMusic()


def _search_youtube_video_id(song_name: str, artist: str) -> str | None:
    """
    Use ytmusicapi to find the YouTube video ID that best matches
    the given song + artist combination.
    Returns the video ID string, or None if nothing is found.
    """
    query = f"{song_name} {artist}"
    try:
        results = ytmusic.search(query, filter="songs", limit=5)
    except Exception:
        results = []

    if results:
        return results[0].get("videoId")

    # Fallback: search without the songs filter
    try:
        results = ytmusic.search(query, limit=5)
    except Exception:
        return None

    for r in results:
        if r.get("videoId"):
            return r["videoId"]

    return None


def _extract_stream_url(video_id: str) -> str | None:
    """
    Use yt-dlp to extract a direct, time-limited audio stream URL from YouTube.

    Key yt-dlp options:
      format        — prefer an audio-only stream (m4a/webm/mp4)
      quiet         — suppress all console output
      no_warnings   — suppress warning lines
      skip_download — never write any bytes to disk (this is the crucial flag)

    The function returns the URL string or None on failure.
    """
    url = f"https://www.youtube.com/watch?v={video_id}"

    ydl_opts = {
        # Request the best audio-only format; fall back to best available
        "format": "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best",
        "quiet": True,
        "no_warnings": True,
        # ---- Critical: never download the file ----
        "skip_download": True,
        # Avoid writing any temporary or cache files
        "noplaylist": True,
        "nocheckcertificate": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # extract_info with download=False returns metadata including the
            # direct CDN URL in info_dict['url']
            info = ydl.extract_info(url, download=False)

            if not info:
                return None

            # Some formats are inside a 'formats' list; pick the direct URL
            stream_url = info.get("url")
            if stream_url:
                return stream_url

            # Fall back to the first format entry that has a URL
            for fmt in info.get("formats", []):
                if fmt.get("url"):
                    return fmt["url"]

    except yt_dlp.utils.DownloadError:
        return None
    except Exception:
        return None

    return None


@app.route("/get_stream_url")
def get_stream_url():
    """
    Bridge endpoint consumed by the frontend.

    Query params:
      song_name — track title
      artist    — artist name

    Returns JSON:
      { "stream_url": "<direct audio URL>", "video_id": "<yt id>" }
    or an error payload.
    """
    song_name = request.args.get("song_name", "").strip()
    artist = request.args.get("artist", "").strip()

    if not song_name:
        return jsonify({"error": "song_name is required"}), 400

    video_id = _search_youtube_video_id(song_name, artist)
    if not video_id:
        return jsonify({"error": f"Song not found on YouTube Music: {song_name} – {artist}"}), 404

    stream_url = _extract_stream_url(video_id)
    if not stream_url:
        return jsonify({"error": "Could not extract a stream URL. Try again later."}), 502

    return jsonify({"stream_url": stream_url, "video_id": video_id})


# ---------------------------------------------------------------------------
# Audio proxy (avoids CORS issues when the browser plays the CDN URL directly)
# ---------------------------------------------------------------------------

@app.route("/proxy_stream")
def proxy_stream():
    """
    Transparently proxy the audio bytes from YouTube's CDN to the browser.
    This sidesteps any CORS restrictions on the raw CDN URL.

    Query params:
      url — the direct stream URL returned by /get_stream_url
    """
    target_url = request.args.get("url", "")
    if not target_url:
        return "url parameter required", 400

    # Forward Range header so the browser can seek inside the audio file
    headers = {}
    if "Range" in request.headers:
        headers["Range"] = request.headers["Range"]
    headers["User-Agent"] = (
        "Mozilla/5.0 (compatible; Musicfy/1.0)"
    )

    try:
        upstream = requests.get(target_url, headers=headers, stream=True, timeout=15)
    except requests.RequestException as exc:
        return str(exc), 502

    # Mirror status code and content-type so the browser's audio element is happy
    response_headers = {
        "Content-Type": upstream.headers.get("Content-Type", "audio/mp4"),
        "Accept-Ranges": "bytes",
    }
    if "Content-Length" in upstream.headers:
        response_headers["Content-Length"] = upstream.headers["Content-Length"]
    if "Content-Range" in upstream.headers:
        response_headers["Content-Range"] = upstream.headers["Content-Range"]

    def generate():
        for chunk in upstream.iter_content(chunk_size=32768):
            if chunk:
                yield chunk

    return Response(
        stream_with_context(generate()),
        status=upstream.status_code,
        headers=response_headers,
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
