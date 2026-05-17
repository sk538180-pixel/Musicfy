/* ==========================================================================
   Musicfy — Mobile Player Logic
   ==========================================================================

   Screen flow:
     Home (playlist grid) → Track List → Now Playing (full-screen)

   Audio flow:
     click track → /get_stream_url → /proxy_stream → <audio>
   ========================================================================== */

// ─── Elements ───────────────────────────────────────────────────────────────
const audio         = document.getElementById("audio");
const seekBar       = document.getElementById("seekBar");
const volumeBar     = document.getElementById("volumeBar");
const currentTimeEl = document.getElementById("currentTime");
const durationEl    = document.getElementById("duration");
const toast         = document.getElementById("toast");

// Now Playing screen
const npTrack     = document.getElementById("npTrack");
const npArtist    = document.getElementById("npArtist");
const npArt       = document.getElementById("npArt");
const npPlayPause = document.getElementById("npPlayPause");

// Mini player
const miniPlayer       = document.getElementById("miniPlayer");
const miniTrack        = document.getElementById("miniTrack");
const miniArtist       = document.getElementById("miniArtist");
const miniPlayPause    = document.getElementById("miniPlayPause");
const miniProgressFill = document.getElementById("miniProgressFill");

// Screens
const screenHome      = document.getElementById("screen-home");
const screenTracks    = document.getElementById("screen-tracks");
const screenNP        = document.getElementById("screen-nowplaying");

// ─── State ──────────────────────────────────────────────────────────────────
let playlists        = [];
let currentPlaylist  = null;
let currentIndex     = -1;
let loadingKey       = null;
let toastTimer       = null;

// ─── Screen navigation ───────────────────────────────────────────────────────

function goTo(screen) {
  [screenHome, screenTracks, screenNP].forEach(s => {
    s.classList.remove("active", "behind");
  });

  if (screen === screenTracks) {
    screenHome.classList.add("behind");
    screenTracks.classList.add("active");
  } else if (screen === screenNP) {
    screenHome.classList.add("behind");
    screenTracks.classList.add("behind");
    screenNP.classList.add("active");
  } else {
    screenHome.classList.add("active");
  }
}

document.getElementById("backBtn").addEventListener("click", () => goTo(screenHome));
document.getElementById("npBackBtn").addEventListener("click", () => {
  if (currentPlaylist) goTo(screenTracks);
  else goTo(screenHome);
});
document.getElementById("miniOpen").addEventListener("click", () => goTo(screenNP));

// ─── Toast ───────────────────────────────────────────────────────────────────

function showToast(msg, duration = 3000, isError = false) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  if (duration > 0) {
    toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
  }
}

function hideToast() {
  clearTimeout(toastTimer);
  toast.classList.remove("show");
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function fmtTime(secs) {
  if (!isFinite(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── Now-Playing UI sync ──────────────────────────────────────────────────────

function updateNowPlayingUI(name, artist) {
  npTrack.textContent    = name   || "—";
  npArtist.textContent   = artist || "";
  miniTrack.textContent  = name   || "—";
  miniArtist.textContent = artist || "";
}

function setPlayIcon(playing) {
  const icon = playing ? "⏸" : "▶";
  npPlayPause.textContent  = icon;
  miniPlayPause.textContent = playing ? "⏸" : "▶";
  npArt.classList.toggle("playing", playing);
}

// ─── Stream fetching ─────────────────────────────────────────────────────────

async function fetchStreamUrl(songName, artist) {
  const params = new URLSearchParams({ song_name: songName, artist });
  const res  = await fetch(`/get_stream_url?${params}`);
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "Stream fetch failed");
  // Wrap with proxy to avoid CORS on raw YouTube CDN URLs
  return `/proxy_stream?url=${encodeURIComponent(data.stream_url)}`;
}

// ─── Play a track by index ───────────────────────────────────────────────────

async function playTrack(index) {
  if (!currentPlaylist) return;
  const track = currentPlaylist.tracks[index];
  if (!track) return;

  const key = `${track.name}||${track.artist}`;
  if (loadingKey === key) return;
  loadingKey = key;

  // Show spinner on track row
  const rows = document.querySelectorAll(".track-item");
  if (rows[index]) {
    rows[index].querySelector(".track-num").innerHTML = '<span class="spinner"></span>';
  }

  showToast(`Loading "${track.name}"…`, 0);
  updateNowPlayingUI(track.name, track.artist);
  miniPlayer.classList.remove("hidden");

  try {
    const url = await fetchStreamUrl(track.name, track.artist);

    if (loadingKey !== key) return; // user picked another track while loading

    audio.src = url;
    audio.load();

    try {
      await audio.play();
    } catch (e) {
      if (e.name === "NotAllowedError") {
        showToast("Tap ▶ to play (browser blocked autoplay)", 4000);
        setPlayIcon(false);
      }
    }

    currentIndex = index;
    highlightTrack(index);
    hideToast();
    showToast(`♪ ${track.name}`);

  } catch (err) {
    showToast(err.message, 5000, true);
    if (rows[index]) rows[index].querySelector(".track-num").textContent = index + 1;
    loadingKey = null;
  }
}

function highlightTrack(index) {
  document.querySelectorAll(".track-item").forEach((el, i) => {
    el.classList.toggle("playing", i === index);
    el.querySelector(".track-num").textContent = i === index ? "" : i + 1;
  });
}

// ─── Playlist grid ────────────────────────────────────────────────────────────

function renderPlaylistGrid(lists) {
  const grid = document.getElementById("playlistGrid");
  if (!lists.length) {
    grid.innerHTML = "<p style='padding:20px;color:var(--muted)'>No playlists found.</p>";
    return;
  }

  grid.innerHTML = lists.map((p, i) => {
    const imgHtml = p.image
      ? `<img class="playlist-card-img" src="${esc(p.image)}" alt="" loading="lazy">`
      : `<div class="playlist-card-emoji">${getPlaylistEmoji(i)}</div>`;

    return `
      <div class="playlist-card" data-index="${i}">
        ${imgHtml}
        <div class="playlist-card-overlay">
          <div class="playlist-card-name">${esc(p.name)}</div>
          <div class="playlist-card-count">${p.count} songs</div>
        </div>
      </div>`;
  }).join("");

  grid.querySelectorAll(".playlist-card").forEach(card => {
    card.addEventListener("click", () => {
      openPlaylist(lists[parseInt(card.dataset.index, 10)]);
    });
  });
}

function getPlaylistEmoji(index) {
  const emojis = ["🎵","🎶","🎸","🎹","🎺","🎻","🥁","🎤","🎧","🎼"];
  return emojis[index % emojis.length];
}

// ─── Track list view ──────────────────────────────────────────────────────────

function openPlaylist(playlist) {
  currentPlaylist = playlist;
  currentIndex    = -1;

  // Hero
  document.getElementById("heroName").textContent  = playlist.name;
  document.getElementById("heroCount").textContent = `${playlist.count} songs`;

  const heroArt = document.getElementById("heroArt");
  if (playlist.image) {
    heroArt.innerHTML = `<img src="${esc(playlist.image)}" alt="">`;
  } else {
    heroArt.innerHTML = playlist.id === "__liked__" ? "♥" : "🎵";
  }

  // Track list
  const list = document.getElementById("trackList");
  list.innerHTML = playlist.tracks.map((t, i) => `
    <div class="track-item" data-index="${i}">
      <div class="track-num">${i + 1}</div>
      <div class="track-thumb">🎵</div>
      <div class="track-meta">
        <div class="track-name">${esc(t.name)}</div>
        <div class="track-artist">${esc(t.artist)}</div>
      </div>
      <div class="track-eq">
        <div class="eq-bar"></div>
        <div class="eq-bar"></div>
        <div class="eq-bar"></div>
      </div>
    </div>`).join("");

  list.querySelectorAll(".track-item").forEach(el => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.dataset.index, 10);
      playTrack(idx);
      goTo(screenNP);
    });
  });

  goTo(screenTracks);
}

// ─── Controls ────────────────────────────────────────────────────────────────

function togglePlayPause() {
  if (!audio.src) return;
  audio.paused ? audio.play() : audio.pause();
}

npPlayPause.addEventListener("click",   togglePlayPause);
miniPlayPause.addEventListener("click", togglePlayPause);

document.getElementById("npPrev").addEventListener("click", () => {
  if (currentIndex > 0) { playTrack(currentIndex - 1); }
});

document.getElementById("npNext").addEventListener("click", () => {
  if (currentPlaylist && currentIndex < currentPlaylist.tracks.length - 1) {
    playTrack(currentIndex + 1);
  }
});

document.getElementById("miniNext").addEventListener("click", () => {
  if (currentPlaylist && currentIndex < currentPlaylist.tracks.length - 1) {
    playTrack(currentIndex + 1);
  }
});

document.getElementById("playAllBtn").addEventListener("click", () => {
  playTrack(0);
  goTo(screenNP);
});

// ─── Audio events ────────────────────────────────────────────────────────────

audio.addEventListener("play",  () => setPlayIcon(true));
audio.addEventListener("pause", () => setPlayIcon(false));

audio.addEventListener("timeupdate", () => {
  if (!isFinite(audio.duration)) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  seekBar.value = pct;
  miniProgressFill.style.width = `${pct}%`;
  currentTimeEl.textContent = fmtTime(audio.currentTime);
  durationEl.textContent    = fmtTime(audio.duration);
});

audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = fmtTime(audio.duration);
});

audio.addEventListener("ended", () => {
  if (currentPlaylist && currentIndex >= 0 &&
      currentIndex < currentPlaylist.tracks.length - 1) {
    playTrack(currentIndex + 1);
  }
});

audio.addEventListener("error", () => {
  showToast("Playback error — try another track", 4000, true);
  setPlayIcon(false);
});

seekBar.addEventListener("input", () => {
  if (isFinite(audio.duration)) {
    audio.currentTime = (seekBar.value / 100) * audio.duration;
  }
});

volumeBar.addEventListener("input", () => {
  audio.volume = volumeBar.value / 100;
});

// ─── Liked Songs button ───────────────────────────────────────────────────────

const likedBtn = document.getElementById("likedBtn");
if (likedBtn) {
  likedBtn.addEventListener("click", async () => {
    showToast("Loading Liked Songs…", 0);
    try {
      const res  = await fetch("/get_liked_songs");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      hideToast();
      openPlaylist(data);
    } catch (err) {
      showToast(err.message, 4000, true);
    }
  });
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

async function loadLibrary() {
  try {
    const res = await fetch("/get_playlists");
    if (res.status === 401) { window.location.href = "/login"; return; }

    playlists = await res.json();
    if (playlists.error) throw new Error(playlists.error);

    renderPlaylistGrid(playlists);
  } catch (err) {
    document.getElementById("playlistGrid").innerHTML =
      `<p style="padding:20px;color:var(--muted)">Error: ${esc(err.message)}</p>`;
  }
}

if (typeof IS_LOGGED_IN !== "undefined" && IS_LOGGED_IN) {
  loadLibrary();
}
