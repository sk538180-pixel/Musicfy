import os
import yt_dlp
import requests
from flask import (
    Flask, request, redirect, session,
    jsonify, render_template, Response, stream_with_context
)
from spotipy.oauth2 import SpotifyOAuth
from ytmusicapi import YTMusic
import spotipy
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "change-me-in-production")
app.config["SESSION_COOKIE_NAME"] = "musicfy_session"
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("FLASK_ENV") == "production"

SPOTIFY_SCOPE = "user-library-read playlist-read-private"

# ---------------------------------------------------------------------------
# Spotify helpers
# ---------------------------------------------------------------------------

def _get_sp_oauth():
    return SpotifyOAuth(
        client_id=os.environ["SPOTIPY_CLIENT_ID"],
        client_secret=os.environ["SPOTIPY_CLIENT_SECRET"],
        redirect_uri=os.environ["SPOTIPY_REDIRECT_URI"],
        scope=SPOTIFY_SCOPE,
        cache_path=None,
        show_dialog=True,
    )

def _get_spotify_client():
    token_info = session.get("token_info")
    if not token_info:
        raise RuntimeError("not_logged_in")
    sp_oauth = _get_sp_oauth()
    if sp_oauth.is_token_expired(token_info):
        token_info = sp_oauth.refresh_access_token(token_info["refresh_token"])
        session["token_info"] = token_info
    return spotipy.Spotify(auth=token_info["access_token"])

# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    logged_in = "token_info" in session
    return render_template("index.html", logged_in=logged_in)

@app.route("/login")
def login():
    sp_oauth = _get_sp_oauth()
    return redirect(sp_oauth.get_authorize_url())

@app.route("/callback")
def callback():
    code = request.args.get("code")
    error = request.args.get("error")
    if error or not code:
        return redirect("/?error=login_failed")
    sp_oauth = _get_sp_oauth()
    token_info = sp_oauth.get_access_token(code, as_dict=True)
    session["token_info"] = token_info
    return redirect("/")

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

# ---------------------------------------------------------------------------
# Spotify data routes
# ---------------------------------------------------------------------------

@app.route("/get_playlists")
def get_playlists():
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
            tracks_result = sp.playlist_tracks(item["id"], limit=50)
            tracks = []
            for t in tracks_result.get("items", []):
                track = t.get("track")
                if not track or not track.get("name"):
                    continue
                artist_names = ", ".join(a["name"] for a in track.get("artists", []))
                tracks.append({"name": track["name"], "artist": artist_names})
            playlists.append({
                "id": item["id"],
                "name": item["name"],
                "count": len(tracks),
                "image": (item.get("images") or [{}])[0].get("url", ""),
                "tracks": tracks
            })
        return jsonify(playlists)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

@app.route("/get_liked_songs")
def get_liked_songs():
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
        return jsonify({"id": "__liked__", "name": "Liked Songs", "image": "", "count": len(tracks), "tracks": tracks})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

# ---------------------------------------------------------------------------
# YouTube Music stream bridge
# ---------------------------------------------------------------------------

ytmusic = YTMusic()

def _search_video_id(song_name: str, artist: str) -> str | None:
    query = f"{song_name} {artist}"
    try:
        results = ytmusic.search(query, filter="songs", limit=5)
        if results:
            return results[0].get("videoId")
    except Exception:
        pass
    try:
        results = ytmusic.search(query, limit=5)
        for r in results:
            if r.get("videoId"):
                return r["videoId"]
    except Exception:
        pass
    return None

def _extract_stream_url(video_id: str) -> str | None:
    """
    Use yt-dlp Python API to extract a direct CDN audio URL.
    download=False / skip_download=True ensure nothing is saved to disk.
    NOTE: This works locally but may fail on cloud platforms (Vercel, Render free tier)
    because YouTube blocks requests from datacenter IP ranges.
    Run this app on your local machine or a residential VPS for best results.
    """
    url = f"https://www.youtube.com/watch?v={video_id}"
    ydl_opts = {
        "format": "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best",
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,   # CRITICAL: never write files to disk
        "noplaylist": True,
        "nocheckcertificate": True,
        "extractor_args": {"youtube": {"skip": ["dash", "hls"]}},
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                return None
            stream_url = info.get("url")
            if stream_url:
                return stream_url
            for fmt in info.get("formats", []):
                if fmt.get("url"):
                    return fmt["url"]
    except Exception:
        return None
    return None

@app.route("/get_stream_url")
def get_stream_url():
    song_name = request.args.get("song_name", "").strip()
    artist = request.args.get("artist", "").strip()
    if not song_name:
        return jsonify({"error": "song_name is required"}), 400

    video_id = _search_video_id(song_name, artist)
    if not video_id:
        return jsonify({"error": f"Not found on YouTube Music: {song_name}"}), 404

    stream_url = _extract_stream_url(video_id)
    if not stream_url:
        return jsonify({
            "error": "Could not get stream URL. If you are on Vercel/cloud, YouTube blocks datacenter IPs. Run locally instead."
        }), 502

    return jsonify({"stream_url": stream_url, "video_id": video_id})

# ---------------------------------------------------------------------------
# Proxy — avoids CORS when browser plays the CDN URL
# ---------------------------------------------------------------------------

@app.route("/proxy_stream")
def proxy_stream():
    target_url = request.args.get("url", "")
    if not target_url:
        return "url parameter required", 400

    headers = {}
    if "Range" in request.headers:
        headers["Range"] = request.headers["Range"]
    headers["User-Agent"] = "Mozilla/5.0 (compatible; Musicfy/1.0)"

    try:
        upstream = requests.get(target_url, headers=headers, stream=True, timeout=20)
    except requests.RequestException as exc:
        return str(exc), 502

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
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
