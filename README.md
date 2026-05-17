# Musicfy

A mobile-style music streaming app — log in with Spotify, browse your playlists, and stream audio ad-free via YouTube Music.

---

## How Streaming Works

Musicfy uses a two-stage approach so it works both **locally and on Vercel**:

| Stage | What it does |
|-------|-------------|
| 1. **Piped.video API** | Fetches audio URLs via Piped's CDN proxy — works on Vercel and all cloud platforms |
| 2. **yt-dlp (fallback)** | Used if Piped fails — works on local machines and residential VPS |

---

## Step 1 — Spotify Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → **Create app**
2. Under **Redirect URIs**, add:
   - For local: `http://localhost:5000/callback`
   - For Vercel: `https://your-app.vercel.app/callback`
3. Save → copy your **Client ID** and **Client Secret**

---

## Step 2 — Local Setup

```bash
cp .env.example .env
# Edit .env and fill in your credentials
pip install -r requirements.txt
python app.py
```

Open **http://localhost:5000**

---

## Step 3 — Deploy to Vercel

1. Push this folder to GitHub
2. Connect the repo at [vercel.com](https://vercel.com)
3. In Vercel → Settings → **Environment Variables**, add:
   - `SPOTIPY_CLIENT_ID`
   - `SPOTIPY_CLIENT_SECRET`
   - `SPOTIPY_REDIRECT_URI` → `https://your-app.vercel.app/callback`
   - `FLASK_SECRET_KEY` → any long random string
4. Deploy

---

## File Structure

```
musicfy/
├── app.py               ← Flask backend (all routes + Piped/yt-dlp bridge)
├── requirements.txt     ← Python dependencies
├── vercel.json          ← Vercel deployment config
├── .env.example         ← Credentials template
├── README.md
├── templates/
│   └── index.html       ← Mobile UI
└── static/
    ├── style.css        ← Mobile-first styles
    └── player.js        ← Audio player logic
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `INVALID_CLIENT` | Check Client ID/Secret |
| Redirect URI mismatch | Add the exact URI in Spotify dashboard |
| Audio not playing | Piped instances may be temporarily down — retry in a moment |
| Autoplay blocked | Tap the ▶ button (browser security requirement) |
| Song not found | Track may not be on YouTube Music |
