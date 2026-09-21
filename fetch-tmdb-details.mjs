import fs from "node:fs";
import vm from "node:vm";

const apiKey = process.env.TMDB_API_KEY;
if (!apiKey) {
  throw new Error("TMDB_API_KEY is missing. Add it as a GitHub Actions repository secret.");
}

const root = new URL("./", import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), "utf8");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(read("catalog-data.js"), context);
vm.runInContext(read("movie-metadata.js"), context);

const catalog = context.window.WLW_CATALOG || {};
const metadata = context.window.WLW_MOVIE_METADATA || {};
const sortableTitle = title => title.replace(/^the\s+/i, "").trim();
const movies = Object.values(catalog)
  .flatMap(group => group.movies)
  .filter(movie => sortableTitle(movie.title).charAt(0).toUpperCase() === "A")
  .sort((a, b) => sortableTitle(a.title).localeCompare(sortableTitle(b.title), "en"));

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function tmdb(path, parameters = {}, allowNotFound = false) {
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("api_key", apiKey);
  for (const [key, value] of Object.entries(parameters)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (response.status === 404 && allowNotFound) return null;
    if (response.status === 429 && attempt < 3) {
      await delay((attempt + 1) * 1200);
      continue;
    }
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`TMDB ${response.status} for ${path}: ${body.slice(0, 300)}`);
    }
    return response.json();
  }
  throw new Error(`TMDB rate limit persisted for ${path}`);
}

function normalized(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function resultTitle(result) {
  return result.title || result.name || "";
}

function resultYear(result) {
  return Number.parseInt((result.release_date || result.first_air_date || "").slice(0, 4), 10) || null;
}

function bestSearchResult(movie, results) {
  const wantedTitle = normalized(movie.title);
  const wantedYear = Number(movie.year);
  return results
    .filter(result => result.media_type === "movie" || result.media_type === "tv")
    .map(result => {
      const candidateTitle = normalized(resultTitle(result));
      const year = resultYear(result);
      let score = 0;
      if (candidateTitle === wantedTitle) score += 100;
      else if (candidateTitle.includes(wantedTitle) || wantedTitle.includes(candidateTitle)) score += 45;
      if (year === wantedYear) score += 35;
      else if (year && Math.abs(year - wantedYear) === 1) score += 10;
      score += Math.min(Number(result.popularity || 0), 20) / 20;
      return { result, score };
    })
    .sort((a, b) => b.score - a.score)[0];
}

async function resolveRecord(movie) {
  const knownId = metadata[movie.title]?.tmdbId;
  if (knownId) {
    const movieDetails = await tmdb(`/movie/${knownId}`, { language: "en-US", append_to_response: "credits" }, true);
    if (movieDetails) return { mediaType: "movie", details: movieDetails };
    const tvDetails = await tmdb(`/tv/${knownId}`, { language: "en-US", append_to_response: "credits" }, true);
    if (tvDetails) return { mediaType: "tv", details: tvDetails };
  }

  const search = await tmdb("/search/multi", {
    query: movie.title,
    language: "en-US",
    include_adult: false
  });
  const match = bestSearchResult(movie, search.results || []);
  if (!match || match.score < 70) {
    throw new Error(`No confident TMDB match for ${movie.title} (${movie.year})`);
  }
  const mediaType = match.result.media_type;
  const details = await tmdb(`/${mediaType}/${match.result.id}`, {
    language: "en-US",
    append_to_response: "credits"
  });
  return { mediaType, details };
}

function compactCast(person) {
  return {
    id: person.id,
    name: person.name,
    character: person.character || person.roles?.map(role => role.character).filter(Boolean).join(" / ") || "",
    order: Number.isFinite(person.order) ? person.order : 9999
  };
}

function serialize(movie, mediaType, details) {
  const cast = [...(details.credits?.cast || [])].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
  const releaseDate = details.release_date || details.first_air_date || "";
  return {
    tmdbId: details.id,
    mediaType,
    matchedTitle: details.title || details.name || movie.title,
    year: Number.parseInt(releaseDate.slice(0, 4), 10) || movie.year,
    genres: (details.genres || []).map(genre => genre.name),
    overview: details.overview || "",
    originalLanguage: details.original_language || "",
    productionCountries: (details.production_countries || []).map(country => ({
      code: country.iso_3166_1,
      name: country.name
    })),
    originCountries: details.origin_country || [],
    femaleCast: cast.filter(person => person.gender === 1).map(compactCast),
    unclassifiedCast: cast.filter(person => person.gender === 0 || person.gender == null).map(compactCast),
    tmdbUrl: `https://www.themoviedb.org/${mediaType}/${details.id}`,
    fetchedAt: new Date().toISOString()
  };
}

const byTitle = {};
const byId = {};
const review = {};

for (const [index, movie] of movies.entries()) {
  process.stdout.write(`[${index + 1}/${movies.length}] ${movie.title}\n`);
  const { mediaType, details } = await resolveRecord(movie);
  const record = serialize(movie, mediaType, details);
  byTitle[movie.title] = record;
  byId[String(record.tmdbId)] = record;
  if (record.unclassifiedCast.length) {
    review[movie.title] = {
      tmdbId: record.tmdbId,
      mediaType: record.mediaType,
      candidates: record.unclassifiedCast
    };
  }
  await delay(120);
}

const banner = "// Generated from the TMDB API by scripts/fetch-tmdb-details.mjs.\n";
const js = `${banner}window.WLW_TMDB_DETAILS = ${JSON.stringify(byTitle, null, 2)};\nwindow.WLW_TMDB_DETAILS_BY_ID = ${JSON.stringify(byId, null, 2)};\n`;
fs.writeFileSync(new URL("tmdb-details.generated.js", root), js);
fs.writeFileSync(
  new URL("tmdb-cast-review.json", root),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), titles: review }, null, 2)}\n`
);

console.log(`Generated TMDB details for ${movies.length} A titles.`);
console.log(`${Object.keys(review).length} titles contain cast entries requiring manual gender review.`);
