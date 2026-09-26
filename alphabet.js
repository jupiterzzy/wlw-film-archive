// CATALOG STANDARD FOR FUTURE ADDITIONS
// 1. Add each new film ONCE inside its country/region in catalog-data.js.
// 2. Required fields: title, four-digit year, poster filename.
// 3. Add its genres in movie-data-utils.js and original/translated titles below.
// 4. A–Z pages are generated automatically. A leading "The" is ignored for
//    both letter assignment and alphabetical sorting. Each letter shows EVERY
//    matching film on one page; there is deliberately no per-letter page limit.

const titleAliases = {
  "Unexpected": ["Ich will dich"],
  "A Woman Like Eve": ["Een vrouw als Eva"],
  "Affäre zu dritt": ["Love and Desire"],
  "Afternoon Breezes": ["Kaze-tachi no gogo", "風たちの午後"],
  "Aimée & Jaguar": ["Aimée and Jaguar"],
  "All the Silence": ["Todo el silencio"],
  "Anaïs in Love": ["Les Amours d'Anaïs"],
  "Attachment": ["Natten har øjne"]
};

const allMovies = Object.values(window.WLW_CATALOG)
  .flatMap(group => group.movies)
  .map(movie => ({
    ...movie,
    aliases: [
      ...(titleAliases[movie.title] || []),
      ...window.getWLWAliases(movie.title)
    ],
    genres: window.getWLWGenres(movie.title)
  }));

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const params = new URLSearchParams(location.search);
const requestedLetter = (params.get("letter") || "A").toUpperCase();
const currentLetter = alphabet.includes(requestedLetter)
  ? requestedLetter
  : "A";

function sortableTitle(title) {
  return title.replace(/^the\s+/i, "").trim();
}

function letterFor(title) {
  return sortableTitle(title).charAt(0).toUpperCase();
}

function compareTitles(a, b) {
  return sortableTitle(a.title).localeCompare(
    sortableTitle(b.title),
    "en",
    {
      sensitivity: "base",
      numeric: true
    }
  );
}

function navigationHref(movie) {
  return `./movie.html?title=${encodeURIComponent(movie.title)}`;
}

const movies = allMovies
  .filter(movie => letterFor(movie.title) === currentLetter)
  .sort(compareTitles);

const movieGrid = document.querySelector("#movie-grid");
const cardTemplate = document.querySelector("#movie-card-template");

document.querySelector("#catalog-title").textContent = currentLetter;
document.title = `${currentLetter} · WLW Film Archive`;

const placeholderPoster = title => {
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <rect width="600" height="600" fill="#241d26"/>
      <circle cx="480" cy="120" r="150" fill="#f05278" opacity=".78"/>
      <path d="M0 480L320 160l280 280v160H0z" fill="#493243"/>
      <text x="48" y="540" fill="#f7f3ee" font-size="92" font-family="Arial" font-weight="700">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

function renderMovies() {
  const fragment = document.createDocumentFragment();

  if (!movies.length) {
    const empty = document.createElement("p");
    empty.className = "empty-letter";
    empty.textContent = "该字母下暂无影片";
    movieGrid.appendChild(empty);
    return;
  }

  movies.forEach(movie => {
    const card = cardTemplate.content.cloneNode(true);
    const poster = card.querySelector(".poster");
    const titleLink = card.querySelector("h3 a");

    card.querySelectorAll("a").forEach(link => {
      link.href = navigationHref(movie);
      link.setAttribute("aria-label", `查看 ${movie.title} 详情`);
    });

    poster.src = window.getWLWPoster(movie);
    poster.alt = `${movie.title} 电影海报`;

    poster.addEventListener(
      "error",
      () => {
        poster.src = placeholderPoster(movie.title);
      },
      { once: true }
    );

    titleLink.textContent = movie.title;
    titleLink.title = movie.title;

    const meta = card.querySelector(".movie-meta");

    meta.innerHTML =
      `<span class="movie-year">${movie.year}</span>` +
      (
        movie.genres.length
          ? `<span class="movie-genres">${movie.genres.slice(0, 2).join(" • ")}</span>`
          : ""
      );

    fragment.appendChild(card);
  });

  movieGrid.appendChild(fragment);
}

function renderAlphabet() {
  const track = document.querySelector("#alphabet-track");

  alphabet.forEach(letter => {
    const link = document.createElement("a");

    link.className =
      `letter-button${letter === currentLetter ? " active" : ""}`;

    link.href =
      letter === "A"
        ? "./alphabet.html"
        : `./alphabet.html?letter=${letter}`;

    link.textContent = letter;

    if (letter === currentLetter) {
      link.setAttribute("aria-current", "page");
    }

    track.appendChild(link);
  });

  requestAnimationFrame(() => {
    const active = track.querySelector(".active");

    if (!active) {
      return;
    }

    track.scrollLeft =
      active.offsetLeft -
      (track.clientWidth - active.clientWidth) / 2;
  });
}

renderMovies();
renderAlphabet();
