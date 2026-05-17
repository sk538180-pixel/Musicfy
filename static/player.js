/* =========================================================================
   Musicfy — frontend player logic
   =========================================================================

   Flow:
   1.  On page load (if logged in) fetch /get_playlists and render sidebar.
   2.  Clicking a playlist loads its tracks into the main track list.
   3.  Clicking a track calls /get_stream_url → receives a direct CDN URL
       → passes it through /proxy_stream to avoid CORS → feeds <audio>.
   4.  The player bar controls the shared <audio> element.
   ========================================================================= */

const audio = document.getElementById("audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const seekBar = document.getElementById("seekBar");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const volumeBar = document.getElementById("volumeBar");
const nowTrackName = document.getElementById("nowTrackName");
const nowTrackArtist = document.getElementById("nowTrackArtist");
const toast = document.getElementById("toast");
const sidebarList = document.getElementById("sidebarList");
const mainContent = document.getElementById("mainContent");
const likedBtn = document.getElementById("likedBtn");

let playlists = [];          // [{id, name, tracks:[{name,artist}]}]
let currentPlaylist = null;  // currently displayed playlist object
let currentIndex = -1;       // index of playing track in currentPlaylist.tracks
let loadingTrackKey = null;  // "name||artist" of the track being fetched

// ─── Utilities ──────────────────────────────────────────────────────────────

function showToast(msg, duration = 3000) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

function fmtTime(secs) {
  if (!isFinite(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Player state helpers ────────────────────────────────────────────────────

function setPlayPauseIcon(playing) {
  playPauseBtn.textContent = playing ? "⏸" : "▶";
}

function updateNowPlaying(name, artist) {
  nowTrackName.textContent = name || "—";
  nowTrackArtist.textContent = artist || "";
}

function highlightRow(index) {
  document.querySelectorAll("tbody tr").forEach((tr, i) => {
    tr.classList.toggle("playing", i === index);
    // Replace row number with animated bar when playing
    const numCell = tr.querySelector(".num");
    if (numCell) {
      numCell.textContent = i === index ? "▶" : i + 1;
    }
  });
}

// ─── Stream URL fetching ─────────────────────────────────────────────────────

/**
 * Hit /get_stream_url, then wrap the returned URL with /proxy_stream
 * to avoid CORS issues in the browser.
 */
async function fetchStreamUrl(songName, artist) {
  const params = new URLSearchParams({ song_name: songName, artist });
  const res = await fetch(`/get_stream_url?${params}`);
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error || "Stream URL fetch failed");
  }

  // Wrap in our proxy so the browser doesn't hit CORS on the raw CDN URL
  const proxied = `/proxy_stream?url=${encodeURIComponent(data.stream_url)}`;
  return proxied;
}

// ─── Play a specific track ───────────────────────────────────────────────────

async function playTrack(index) {
  if (!currentPlaylist || !currentPlaylist.tracks[index]) return;

  const track = currentPlaylist.tracks[index];
  const key = `${track.name}||${track.artist}`;

  // Prevent double-firing
  if (loadingTrackKey === key) return;
  loadingTrackKey = key;

  // Show loading indicator in the row
  const rows = document.querySelectorAll("tbody tr");
  if (rows[index]) {
    rows[index].querySelector(".num").innerHTML =
      '<span class="spinner"></span>';
  }

  showToast(`Loading "${track.name}"…`, 8000);
  updateNowPlaying(track.name, track.artist);

  try {
    const url = await fetchStreamUrl(track.name, track.artist);

    // Only apply if the user hasn't clicked another track in the meantime
    if (loadingTrackKey !== key) return;

    audio.src = url;
    audio.load();

    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch((e) => {
        // Autoplay may be blocked on first interaction — show hint
        if (e.name === "NotAllowedError") {
          showToast("Click play to start (autoplay blocked by browser)");
          setPlayPauseIcon(false);
        }
      });
    }

    currentIndex = index;
    highlightRow(index);
    toast.classList.remove("show"); // dismiss loading toast
    showToast(`Now playing: ${track.name}`);
  } catch (err) {
    showToast(`Error: ${err.message}`);
    if (rows[index]) rows[index].querySelector(".num").textContent = index + 1;
    loadingTrackKey = null;
  }
}

// ─── Track list renderer ─────────────────────────────────────────────────────

function renderTrackList(playlist) {
  currentPlaylist = playlist;
  currentIndex = -1;

  mainContent.innerHTML = `
    <div class="track-list-header">
      <h2>${escHtml(playlist.name)}</h2>
      <p>${playlist.tracks.length} track${playlist.tracks.length !== 1 ? "s" : ""}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th class="num">#</th>
          <th>Title</th>
          <th>Artist</th>
        </tr>
      </thead>
      <tbody>
        ${playlist.tracks
          .map(
            (t, i) => `
          <tr data-index="${i}">
            <td class="num">${i + 1}</td>
            <td class="song">${escHtml(t.name)}</td>
            <td class="artist">${escHtml(t.artist)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;

  // Click to play
  mainContent.querySelectorAll("tbody tr").forEach((tr) => {
    tr.addEventListener("click", () => {
      const idx = parseInt(tr.dataset.index, 10);
      playTrack(idx);
    });
  });

  // Mark active sidebar item
  document.querySelectorAll(".playlist-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.id === playlist.id);
  });
}

function escHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── Sidebar / playlist loading ───────────────────────────────────────────────

async function loadPlaylists() {
  sidebarList.innerHTML = '<p class="sidebar-loading"><span class="spinner"></span>Loading…</p>';

  try {
    const res = await fetch("/get_playlists");
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    playlists = await res.json();

    if (playlists.error) throw new Error(playlists.error);

    if (!playlists.length) {
      sidebarList.innerHTML = '<p class="sidebar-loading">No playlists found.</p>';
      return;
    }

    sidebarList.innerHTML = playlists
      .map(
        (p) =>
          `<div class="playlist-item" data-id="${escHtml(p.id)}">${escHtml(p.name)}</div>`
      )
      .join("");

    sidebarList.querySelectorAll(".playlist-item").forEach((el, i) => {
      el.addEventListener("click", () => renderTrackList(playlists[i]));
    });

    // Auto-open first playlist
    renderTrackList(playlists[0]);
  } catch (err) {
    sidebarList.innerHTML = `<p class="sidebar-loading">Error: ${err.message}</p>`;
  }
}

async function loadLikedSongs() {
  showToast("Loading Liked Songs…");
  try {
    const res = await fetch("/get_liked_songs");
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    // Give it a synthetic id so the sidebar active state works
    data.id = "__liked__";
    renderTrackList(data);
    document.querySelectorAll(".playlist-item").forEach((el) =>
      el.classList.remove("active")
    );
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
}

// ─── Audio element event listeners ───────────────────────────────────────────

audio.addEventListener("timeupdate", () => {
  if (!isFinite(audio.duration)) return;
  seekBar.value = (audio.currentTime / audio.duration) * 100;
  currentTimeEl.textContent = fmtTime(audio.currentTime);
  durationEl.textContent = fmtTime(audio.duration);
});

audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = fmtTime(audio.duration);
});

audio.addEventListener("play", () => setPlayPauseIcon(true));
audio.addEventListener("pause", () => setPlayPauseIcon(false));

// Auto-advance to the next track when one finishes
audio.addEventListener("ended", () => {
  if (
    currentPlaylist &&
    currentIndex >= 0 &&
    currentIndex < currentPlaylist.tracks.length - 1
  ) {
    playTrack(currentIndex + 1);
  }
});

// ─── Player controls ──────────────────────────────────────────────────────────

playPauseBtn.addEventListener("click", () => {
  if (!audio.src) return;
  audio.paused ? audio.play() : audio.pause();
});

seekBar.addEventListener("input", () => {
  if (!isFinite(audio.duration)) return;
  audio.currentTime = (seekBar.value / 100) * audio.duration;
});

volumeBar.addEventListener("input", () => {
  audio.volume = volumeBar.value / 100;
});

document.getElementById("prevBtn").addEventListener("click", () => {
  if (currentIndex > 0) playTrack(currentIndex - 1);
});

document.getElementById("nextBtn").addEventListener("click", () => {
  if (currentPlaylist && currentIndex < currentPlaylist.tracks.length - 1) {
    playTrack(currentIndex + 1);
  }
});

// ─── Bootstrap ───────────────────────────────────────────────────────────────

if (likedBtn) {
  likedBtn.addEventListener("click", loadLikedSongs);
}

// IS_LOGGED_IN is injected by the Jinja template
if (typeof IS_LOGGED_IN !== "undefined" && IS_LOGGED_IN) {
  loadPlaylists();
}
