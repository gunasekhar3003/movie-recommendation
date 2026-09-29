const grid = document.getElementById("movieGrid");
const recGrid = document.getElementById("recommendationGrid");
const filters = document.getElementById("genreFilters");
const searchInput = document.getElementById("searchInput");
const resultsCount = document.getElementById("resultsCount");
const emptyState = document.getElementById("emptyState");
const basedOnTitle = document.getElementById("basedOnTitle");
let activeGenre = "all";
let selectedId = null;
let debounceTimer;

const palettes = [
  ["#543d69","#bd795f"],["#27566a","#75a49a"],["#8b4e53","#d59a69"],
  ["#4e527f","#9b8cbb"],["#456b55","#b1a56b"],["#814e78","#d28caa"],
  ["#3d506e","#7fa6bd"],["#7b623d","#c69d58"],["#4e5d69","#a5a5a1"]
];
const symbols = ["✦","◈","✧","◉","✺","⌁","△","✷","◌","✹"];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function paletteFor(id) { return palettes[(Number(id) * 7) % palettes.length]; }
function poster(movie) {
  const [a,b] = paletteFor(movie.id);
  const safeTitle = escapeHtml(movie.title);
  const year = escapeHtml(movie.year);
  const symbol = symbols[Number(movie.id) % symbols.length];
  return `<div class="poster-art" style="background:radial-gradient(circle at 75% 20%,${b}aa,transparent 36%),linear-gradient(145deg,${a},${b} 58%,#171725)">
    <span class="poster-year">${year}</span><span class="poster-symbol">${symbol}</span><span class="poster-art-title">${safeTitle}</span></div>`;
}
function card(movie, recommended=false) {
  const isSelected = selectedId === movie.id && !recommended;
  const genres = movie.genres.slice(0,2).join(" · ");
  return `<article class="movie-card ${isSelected ? "selected":""}" data-id="${movie.id}" tabindex="0" role="button" aria-label="Get recommendations based on ${escapeHtml(movie.title)}">
    ${poster(movie)}<span class="select-hint">${recommended ? "SIMILAR" : "SELECT +"}</span>
    <div class="movie-info"><div class="movie-title">${escapeHtml(movie.title)}</div>
      <div class="movie-meta"><span>${escapeHtml(movie.year)}</span><span class="rating">★ ${movie.rating == null ? "—" : Number(movie.rating).toFixed(1)}</span></div>
      <div class="movie-genres">${escapeHtml(genres)}</div></div>
  </article>`;
}
async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Unable to load data");
  return response.json();
}
async function loadGenres() {
  const genres = await getJSON("/api/genres");
  filters.innerHTML = `<button class="filter active" data-genre="all">All movies</button>` +
    genres.map(g => `<button class="filter" data-genre="${escapeHtml(g)}">${escapeHtml(g)}</button>`).join("");
}
async function loadMovies() {
  const params = new URLSearchParams();
  if (activeGenre !== "all") params.set("genre", activeGenre);
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  try {
    const movies = await getJSON(`/api/movies?${params.toString()}`);
    grid.innerHTML = movies.map(m => card(m)).join("");
    resultsCount.textContent = `${movies.length} MOVIES TO EXPLORE`;
    emptyState.classList.toggle("hidden", movies.length !== 0);
    grid.classList.toggle("hidden", movies.length === 0);
    if (selectedId && !movies.some(m => m.id === selectedId)) {
      document.querySelectorAll(".movie-card").forEach(el => el.classList.remove("selected"));
    }
  } catch (error) {
    resultsCount.textContent = "Could not connect to the server.";
    grid.innerHTML = `<div class="recommend-placeholder"><p>Start the Flask server and refresh this page.</p></div>`;
  }
}
async function loadRecommendations(id) {
  try {
    const data = await getJSON(`/api/recommend/${id}?limit=6`);
    basedOnTitle.textContent = data.based_on.title;
    recGrid.innerHTML = data.recommendations.map(m => card(m, true)).join("");
    document.getElementById("recommendations").scrollIntoView({behavior:"smooth",block:"start"});
  } catch (error) {
    basedOnTitle.textContent = "your selection";
    recGrid.innerHTML = `<div class="recommend-placeholder"><p>Recommendations could not be loaded. Please try again.</p></div>`;
  }
}
grid.addEventListener("click", event => {
  const el = event.target.closest(".movie-card");
  if (!el) return;
  selectedId = Number(el.dataset.id);
  document.querySelectorAll("#movieGrid .movie-card").forEach(cardEl => cardEl.classList.toggle("selected", Number(cardEl.dataset.id) === selectedId));
  loadRecommendations(selectedId);
});
grid.addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.classList.contains("movie-card")) {
    event.preventDefault(); event.target.click();
  }
});
filters.addEventListener("click", event => {
  const btn = event.target.closest(".filter");
  if (!btn) return;
  activeGenre = btn.dataset.genre;
  filters.querySelectorAll(".filter").forEach(b => b.classList.toggle("active", b === btn));
  loadMovies();
});
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadMovies, 220);
});
(async function init() {
  try { await loadGenres(); await loadMovies(); }
  catch (error) { resultsCount.textContent = "Could not connect to the server."; }
})();
