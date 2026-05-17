/* ─── Reset ─────────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:       #0a0a0a;
  --card:     #161616;
  --card2:    #1e1e1e;
  --border:   #2a2a2a;
  --accent:   #1db954;
  --accent2:  #1ed760;
  --text:     #f0f0f0;
  --muted:    #8a8a8a;
  --danger:   #e74c3c;
  --radius:   16px;
  --mini-h:   70px;
  --nav-h:    0px;           /* no bottom nav needed */
  --safe-bot: env(safe-area-inset-bottom, 0px);
}

html { height: 100%; overflow: hidden; }

body {
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 15px;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  user-select: none;
}

/* ─── Screen system ──────────────────────────────────────────────────────── */
.screen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateX(100%);
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--bg);
  /* leave room at bottom for mini player */
  padding-bottom: calc(var(--mini-h) + var(--safe-bot) + 8px);
  will-change: transform;
}

.screen.active  { transform: translateX(0); }
.screen.behind  { transform: translateX(-18%); }   /* home pushed slightly left */

/* ─── Top bar ────────────────────────────────────────────────────────────── */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 52px 20px 12px;
  flex-shrink: 0;
}

.top-bar-title {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.2px;
  flex: 1;
  text-align: center;
}

.logo-dot { color: var(--accent); margin-right: 4px; }

.icon-btn {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  background: var(--card2);
  border: none;
  border-radius: 50%;
  color: var(--text);
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s;
  text-decoration: none;
  flex-shrink: 0;
}
.icon-btn:hover { background: var(--border); }
.icon-btn:active { transform: scale(0.93); }

.pill-btn {
  padding: 8px 16px;
  background: var(--accent);
  color: #000;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
  border: none;
  cursor: pointer;
}

/* ─── HOME SCREEN ────────────────────────────────────────────────────────── */
.home-greeting {
  padding: 0 24px 20px;
  flex-shrink: 0;
}
.greeting-sub  { font-size: 0.8rem; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
.greeting-title { font-size: 1.8rem; font-weight: 800; }

/* Playlist grid */
.playlist-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 0 16px 20px;
  overflow-y: auto;
  flex: 1;
  -webkit-overflow-scrolling: touch;
}

.playlist-card {
  background: var(--card);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  position: relative;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.playlist-card:active { transform: scale(0.96); }

.playlist-card-img {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  border-radius: var(--radius);
}

.playlist-card-emoji {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.playlist-card-overlay {
  position: relative;
  padding: 10px 12px;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%);
  z-index: 1;
}

.playlist-card-name {
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-card-count {
  font-size: 0.72rem;
  color: var(--muted);
  margin-top: 2px;
}

/* Liked Songs card — special accent */
.playlist-card.liked-card .playlist-card-emoji {
  background: linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #991b1b 100%);
}

/* Skeleton */
.skeleton-card {
  aspect-ratio: 1;
  background: var(--card);
  border-radius: var(--radius);
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Welcome screen (logged out) */
.welcome-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
  gap: 16px;
}
.welcome-icon  { font-size: 5rem; }
.welcome-title { font-size: 2.4rem; font-weight: 800; }
.welcome-sub   { font-size: 0.95rem; color: var(--muted); max-width: 260px; line-height: 1.5; }
.welcome-note  { font-size: 0.75rem; color: #e67e22; max-width: 280px; line-height: 1.4; margin-top: 8px; }

.spotify-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 32px;
  background: var(--accent);
  color: #000;
  font-weight: 700;
  font-size: 0.95rem;
  border-radius: 50px;
  text-decoration: none;
  margin-top: 12px;
  transition: background 0.15s, transform 0.1s;
}
.spotify-btn:active { transform: scale(0.97); background: var(--accent2); }

/* ─── TRACK LIST SCREEN ──────────────────────────────────────────────────── */
.playlist-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 24px 24px;
  gap: 10px;
  flex-shrink: 0;
}

.playlist-hero-art {
  width: 160px; height: 160px;
  border-radius: 16px;
  background: linear-gradient(135deg, #1a1a2e, #0f3460);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  overflow: hidden;
}

.playlist-hero-art img {
  width: 100%; height: 100%;
  object-fit: cover;
  border-radius: 16px;
}

.playlist-hero-name  { font-size: 1.3rem; font-weight: 800; text-align: center; }
.playlist-hero-count { font-size: 0.82rem; color: var(--muted); }

.play-all-btn {
  margin-top: 6px;
  padding: 12px 36px;
  background: var(--accent);
  color: #000;
  font-weight: 700;
  font-size: 0.9rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.play-all-btn:active { transform: scale(0.96); background: var(--accent2); }

.track-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 0 8px;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.12s;
  position: relative;
}
.track-item:active { background: var(--card); }
.track-item.playing { background: rgba(29,185,84,0.07); }

.track-num {
  width: 24px;
  text-align: center;
  font-size: 0.8rem;
  color: var(--muted);
  flex-shrink: 0;
}
.track-item.playing .track-num { color: var(--accent); }

.track-thumb {
  width: 46px; height: 46px;
  background: var(--card2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
  overflow: hidden;
}

.track-meta { flex: 1; min-width: 0; }
.track-name   { font-size: 0.9rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.track-artist { font-size: 0.78rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
.track-item.playing .track-name { color: var(--accent); }

.track-eq {
  display: none;
  gap: 2px;
  align-items: flex-end;
  height: 16px;
  flex-shrink: 0;
}
.track-item.playing .track-eq { display: flex; }
.eq-bar {
  width: 3px;
  background: var(--accent);
  border-radius: 2px;
  animation: eq 0.8s ease-in-out infinite alternate;
}
.eq-bar:nth-child(1) { height: 40%; animation-delay: 0s; }
.eq-bar:nth-child(2) { height: 100%; animation-delay: 0.15s; }
.eq-bar:nth-child(3) { height: 65%; animation-delay: 0.3s; }

@keyframes eq {
  from { transform: scaleY(0.4); }
  to   { transform: scaleY(1); }
}

/* ─── NOW PLAYING SCREEN ─────────────────────────────────────────────────── */
.np-bar { background: transparent; }

#screen-nowplaying {
  background: linear-gradient(180deg, #1a1a2e 0%, #0a0a0a 60%);
}

.np-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 32px 20px;
  gap: 24px;
  overflow: hidden;
}

.np-art {
  width: min(280px, 78vw);
  height: min(280px, 78vw);
  border-radius: 20px;
  background: linear-gradient(135deg, #1a1a2e, #0f3460);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6rem;
  box-shadow: 0 30px 80px rgba(0,0,0,0.6);
  overflow: hidden;
  transition: transform 0.3s;
  flex-shrink: 0;
}
.np-art.playing { transform: scale(1.03); }
.np-art img { width: 100%; height: 100%; object-fit: cover; border-radius: 20px; }

.np-info {
  text-align: center;
  width: 100%;
}
.np-track  { font-size: 1.25rem; font-weight: 800; line-height: 1.2; }
.np-artist { font-size: 0.9rem; color: var(--muted); margin-top: 4px; }

.np-progress {
  width: 100%;
}
.np-progress input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  accent-color: var(--accent);
}
.np-progress input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}

.np-times {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 0.72rem;
  color: var(--muted);
}

.np-controls {
  display: flex;
  align-items: center;
  gap: 32px;
}

.np-ctrl {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text);
  font-size: 1.4rem;
  transition: transform 0.1s, color 0.15s;
  padding: 8px;
}
.np-ctrl:active { transform: scale(0.88); }
.np-ctrl.ghost { color: var(--muted); font-size: 1.1rem; }
.np-ctrl.ghost:hover { color: var(--text); }

.np-ctrl.big {
  width: 64px; height: 64px;
  background: #fff;
  color: #000;
  border-radius: 50%;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(255,255,255,0.2);
}
.np-ctrl.big:active { transform: scale(0.93); }

.np-volume {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.vol-icon { font-size: 0.85rem; }
.np-volume input[type="range"] {
  -webkit-appearance: none;
  flex: 1;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  accent-color: var(--accent);
}
.np-volume input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
}

/* ─── MINI PLAYER ────────────────────────────────────────────────────────── */
.mini-player {
  position: fixed;
  left: 12px; right: 12px;
  bottom: calc(var(--safe-bot) + 10px);
  height: var(--mini-h);
  background: #242424;
  border-radius: 14px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 12px;
  z-index: 200;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  overflow: hidden;
  transition: transform 0.3s, opacity 0.3s;
}
.mini-player.hidden { transform: translateY(100px); opacity: 0; pointer-events: none; }

.mini-progress-bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: var(--border);
}
.mini-progress-fill {
  height: 100%;
  background: var(--accent);
  width: 0%;
  transition: width 0.5s linear;
}

.mini-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.mini-art {
  width: 46px; height: 46px;
  background: linear-gradient(135deg, #1a1a2e, #0f3460);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.mini-info { min-width: 0; }
.mini-track  { font-size: 0.88rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mini-artist { font-size: 0.75rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.mini-controls { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.mini-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, transform 0.1s;
  background: none;
  color: var(--text);
}
.mini-btn:active { transform: scale(0.9); }
#miniPlayPause { background: var(--accent); color: #000; font-size: 0.9rem; }

/* ─── TOAST ──────────────────────────────────────────────────────────────── */
#toast {
  position: fixed;
  bottom: calc(var(--mini-h) + var(--safe-bot) + 20px);
  left: 50%;
  transform: translateX(-50%) translateY(16px);
  background: rgba(36,36,36,0.95);
  color: var(--text);
  padding: 10px 20px;
  border-radius: 50px;
  font-size: 0.82rem;
  border: 1px solid var(--border);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s, transform 0.2s;
  z-index: 300;
  white-space: nowrap;
  backdrop-filter: blur(10px);
  max-width: 90vw;
  text-align: center;
}
#toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
#toast.error { border-color: var(--danger); color: #ff8a80; }

/* ─── Spinner ────────────────────────────────────────────────────────────── */
.spinner {
  display: inline-block;
  width: 12px; height: 12px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Scrollbar (desktop/tablet) ─────────────────────────────────────────── */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
