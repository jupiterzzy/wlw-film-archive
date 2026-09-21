(function () {
  const params = new URLSearchParams(location.search);
  const requestedTitle = params.get("title") || "";
  const catalogGroups = Object.values(window.WLW_CATALOG || {});
  const catalogMovies = catalogGroups.flatMap(group =>
    group.movies.map(movie => ({ ...movie, catalogGroup: group.title, catalogType: group.type }))
  );
  const movie = catalogMovies.find(item => item.title === requestedTitle);
  const metadata = movie ? window.getWLWMetadata(movie.title) : {};
  const details = movie
    ? (window.WLW_TMDB_DETAILS || {})[movie.title] ||
      (metadata.tmdbId ? (window.WLW_TMDB_DETAILS_BY_ID || {})[String(metadata.tmdbId)] : null)
    : null;
  const translations = window.WLW_SYNOPSIS_TRANSLATIONS || {};

  const loading = document.querySelector("#detail-loading");
  const article = document.querySelector("#detail-article");
  const error = document.querySelector("#detail-error");
  const errorMessage = document.querySelector("#detail-error-message");

  function showError(message) {
    loading.hidden = true;
    article.hidden = true;
    errorMessage.textContent = message;
    error.hidden = false;
  }

  if (!movie) {
    showError("没有找到这部电影。请从电影列表重新进入详情页。");
    return;
  }

  if (!details) {
    showError("TMDB 资料尚未生成。请先运行仓库中的 Update TMDB detail data 工作流程。");
    return;
  }

  const poster = document.querySelector("#detail-poster");
  poster.src = window.getWLWPoster(movie);
  poster.alt = `${movie.title} 电影海报`;
  poster.addEventListener("error", () => poster.remove(), { once: true });

  document.querySelector("#detail-title").textContent = movie.title;
  document.title = `${movie.title} · WLW Film Archive`;

  const year = details.year || metadata.year || movie.year;
  const genres = (details.genres || []).map(item => typeof item === "string" ? item : item.name).filter(Boolean);
  document.querySelector("#detail-meta").textContent = [year, ...genres].filter(Boolean).join(" • ");

  const synopsis = document.querySelector("#synopsis");
  const english = document.createElement("p");
  english.className = "synopsis-en";
  english.lang = "en";
  english.textContent = details.overview || "No English synopsis is currently available from TMDB.";
  synopsis.appendChild(english);

  const translation = translations[String(details.tmdbId)] || translations[movie.title];
  if (details.originalLanguage === "en" && translation) {
    const chinese = document.createElement("p");
    chinese.className = "synopsis-zh";
    chinese.lang = "zh-CN";
    chinese.textContent = translation;
    synopsis.appendChild(chinese);
  }

  const castList = document.querySelector("#cast-list");
  const castOverride = (window.WLW_CAST_OVERRIDES || {})[movie.title] || {};
  const excludedIds = new Set((castOverride.exclude || []).map(String));
  const femaleCast = [...(details.femaleCast || []), ...(castOverride.include || [])]
    .filter(person => !excludedIds.has(String(person.id)))
    .filter((person, index, items) => items.findIndex(item => String(item.id) === String(person.id)) === index)
    .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
  if (!femaleCast.length) {
    const empty = document.createElement("p");
    empty.className = "cast-empty";
    empty.textContent = "TMDB 暂未提供可确认的女性演员资料。";
    castList.appendChild(empty);
  } else {
    femaleCast.forEach(person => {
  const member = document.createElement("div");
  member.className = "cast-member";

  if (person.profilePath) {
    const photo = document.createElement("img");
    photo.className = "cast-photo";
    photo.src = `https://image.tmdb.org/t/p/w342${person.profilePath}`;
    photo.alt = person.name;
    photo.loading = "lazy";
    photo.addEventListener("error", () => photo.remove(), { once: true });
    member.appendChild(photo);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "cast-photo cast-photo-placeholder";
    placeholder.setAttribute("aria-hidden", "true");
    member.appendChild(placeholder);
  }

  const name = document.createElement("span");
  name.className = "cast-name";
  name.textContent = person.name;
  member.appendChild(name);

  const role = document.createElement("span");
  role.className = "cast-role";
  role.textContent = person.character || "—";
  member.appendChild(role);

  castList.appendChild(member);
});
  }

  loading.hidden = true;
  article.hidden = false;
})();
