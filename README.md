# Musicfy

A minimal Flask web app that lets you log in with Spotify, browse your playlists and liked songs, and stream audio ad-free via YouTube Music — no downloads, no ads.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10 or newer |
| pip | Included with Python |

---

## Step 1 — Get your Spotify credentials

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in.
2. Click **Create app**.
3. Fill in any app name/description.
4. Under **Redirect URIs**, add exactly:
   ```
   http://localhost:5000/callback
   ```
5. Save, then copy your **Client ID** and **Client Secret**.

---

## Step 2 — Set up environment variables

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your values:
   ```env
   SPOTIPY_CLIENT_ID=your_client_id
   SPOTIPY_CLIENT_SECRET=your_client_secret
   SPOTIPY_REDIRECT_URI=http://localhost:5000/callback
   FLASK_SECRET_KEY=any-long-random-string
   ```

---

## Step 3 — Install dependencies

```bash
pip install -r requirements.txt
```

---

## Step 4 — Run the app

```bash
python app.py
```

Open your browser to **http://localhost:5000** and click **Connect Spotify**.

---

## How it works

```
Browser  →  /login            Redirects to Spotify OAuth
         ←  /callback         Receives token, stores in session
         →  /get_playlists    Returns JSON list of playlists + tracks
         →  /get_stream_url   ytmusicapi searches YT Music → yt-dlp extracts CDN URL
         →  /proxy_stream     Flask proxies CDN bytes to avoid CORS in browser
         ←  <audio>           HTML5 audio element plays the stream
```

**Key design decisions:**
- `yt-dlp` is used with `download=False` — it **never writes files to disk**.
- The CDN URL is wrapped by `/proxy_stream` to avoid browser CORS errors.
- Spotify tokens are stored only in the Flask session (in-memory); never on disk.

---

## Project structure

```
musicfy/
├── app.py            ← Flask app (all routes + logic)
├── requirements.txt  ← Python dependencies
├── .env.example      ← Credentials template
├── README.md         ← This file
├── templates/
│   └── index.html    ← Jinja2 HTML template
└── static/
    ├── style.css     ← Dark-mode UI styles
    └── player.js     ← Audio player logic
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `INVALID_CLIENT` from Spotify | Check your Client ID/Secret in `.env` |
| Redirect URI mismatch | Ensure `http://localhost:5000/callback` is listed in your Spotify app **exactly** |
| Song not found | Some tracks are not on YouTube Music; the app shows an error toast |
| Stream URL expired | CDN URLs are time-limited; refresh the page if a track stops mid-play |
| Autoplay blocked | Click the ▶ play button — browsers block autoplay until user interaction |

---

## Limitations

- Stream URLs from YouTube are time-limited (~6 hours). Long playlists may need re-fetching.
- Some less-popular tracks may not be available on YouTube Music.
- The proxy adds a small latency overhead at the start of each track.
