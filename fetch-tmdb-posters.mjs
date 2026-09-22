import fs from "node:fs/promises";

const API_KEY = process.env.TMDB_API_KEY;

if (!API_KEY) {
  throw new Error(
    "TMDB_API_KEY is missing. Add it in GitHub → Settings → Secrets and variables → Actions."
  );
}

const API_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

function parseAssignedObject(source, variableName) {
  const marker = `window.${variableName}`;
  const markerIndex = source.indexOf(marker);

  if (markerIndex === -1) {
    throw new Error(`Could not find ${marker} in source file.`);
  }

  const equalsIndex = source.indexOf("=", markerIndex);

  if (equalsIndex === -1) {
    throw new Error(`Could not find assignment for ${marker}.`);
  }

  const objectStart = source.indexOf("{", equalsIndex);

  if (objectStart === -1) {
    throw new Error(`Could not find object start for ${marker}.`);
  }

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let i = objectStart; i < source.length; i += 1) {
    const char = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === quote) {
        inString = false;
      }

      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return JSON.parse(source.slice(objectStart, i + 1));
      }
    }
  }

  throw new Error(`Could not parse ${marker}.`);
}

async function tmdb(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`);

  url.searchParams.set("api_key", API_KEY);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(
      `TMDB ${response.status} ${response.statusText}: ${url.pathname}`
    );
  }

  return response.json();
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/^the\s+/, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function yearOf(date) {
  return Number.parseInt(String(date || "").slice(0, 4), 10) || 0;
}

function candidateScore(movie, candidate) {
  const wanted = normalize(movie.title);
  const title = normalize(candidate.title);
  const original = normalize(candidate.original_title);

  let score = 0;

  if (title === wanted) score += 100;
  if (original === wanted) score += 95;
  if (title.includes(wanted) || wanted.includes(title)) score += 18;
  if (original.includes(wanted) || wanted.includes(original)) score += 15;

  const candidateYear = yearOf(candidate.release_date);

  if (candidateYear === Number(movie.year)) {
    score += 60;
  } else if (Math.abs(candidateYear - Number(movie.year)) === 1) {
    score += 8;
  }

  score += Math.min(Number(candidate.popularity || 0), 20) / 20;

  return score;
}

async function searchMovie(movie, metadataEntry) {
  const aliases = Array.isArray(metadataEntry?.aliases)
    ? metadataEntry.aliases
    : [];

  const queries = [movie.title, ...aliases].filter(Boolean);
  const seen = new Map();

  for (const query of queries) {
    const result = await tmdb("/search/movie", {
      query,
      include_adult: "false",
      year: movie.year,
      language: "en-US"
    });

    for (const candidate of result.results || []) {
      seen.set(candidate.id, candidate);
    }

    if (seen.size === 0) {
      const broadResult = await tmdb("/search/movie", {
        query,
        include_adult: "false",
        language: "en-US"
      });

      for (const candidate of broadResult.results || []) {
        seen.set(candidate.id, candidate);
      }
    }
  }

  const candidates = [...seen.values()]
    .map(candidate => ({
      candidate,
      score: candidateScore(movie, candidate)
    }))
    .sort((a, b) => b.score - a.score);

  if (!candidates.length) {
    throw new Error(`No TMDB match found for ${movie.title} (${movie.year}).`);
  }

  return candidates[0].candidate;
}

async function getMovieDetails(tmdbId) {
  return tmdb(`/movie/${tmdbId}`, {
    language: "en-US"
  });
}

async function getMovieImages(tmdbId, preferredLanguage) {
  const languages = [
    preferredLanguage,
    preferredLanguage === "en" ? null : "en",
    "null"
  ].filter(Boolean);

  return tmdb(`/movie/${tmdbId}/images`, {
    include_image_language: [...new Set(languages)].join(",")
  });
}

function bestPoster(posters, preferredLanguage) {
  if (!posters?.length) return null;

  const languagePriority = language => {
    if (language === preferredLanguage) return 0;
    if (language === "en") return 1;
    if (language === null) return 2;
    return 3;
  };

  return [...posters].sort((a, b) => {
    const languageDifference =
      languagePriority(a.iso_639_1) - languagePriority(b.iso_639_1);

    if (languageDifference !== 0) return languageDifference;

    const voteDifference =
      Number(b.vote_average || 0) - Number(a.vote_average || 0);

    if (voteDifference !== 0) return voteDifference;

    return Number(b.width || 0) - Number(a.width || 0);
  })[0];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const catalogSource = await fs.readFile("catalog-data.js", "utf8");
const metadataSource = await fs.readFile("movie-metadata.js", "utf8");

const catalog = parseAssignedObject(catalogSource, "WLW_CATALOG");
const metadata = parseAssignedObject(
  metadataSource,
  "WLW_MOVIE_METADATA"
);

const movieMap = new Map();

Object.values(catalog)
  .flatMap(group => group.movies || [])
  .forEach(movie => {
    if (!movieMap.has(movie.title)) {
      movieMap.set(movie.title, movie);
    }
  });

const movies = [...movieMap.values()].sort((a, b) =>
  normalize(a.title).localeCompare(normalize(b.title), "en")
);

const failures = [];

for (const [index, movie] of movies.entries()) {
  const entry = metadata[movie.title] || {
    year: movie.year,
    aliases: []
  };

  process.stdout.write(
    `[${index + 1}/${movies.length}] ${movie.title} (${movie.year})\n`
  );

  try {
    let tmdbId = entry.tmdbId
      ? Number(entry.tmdbId)
      : null;

    let details;

    if (tmdbId) {
      details = await getMovieDetails(tmdbId);

      const detailYear = yearOf(details.release_date);

      // Guard against an old/wrong hard-coded match.
      if (
        normalize(details.title) !== normalize(movie.title) &&
        normalize(details.original_title) !== normalize(movie.title) &&
        detailYear !== Number(movie.year)
      ) {
        tmdbId = null;
        details = null;
      }
    }

    if (!tmdbId) {
      const match = await searchMovie(movie, entry);
      tmdbId = Number(match.id);
      details = await getMovieDetails(tmdbId);
    }

    const preferredLanguage =
      entry.posterLanguage ||
      details.original_language ||
      "en";

    const imageData = await getMovieImages(
      tmdbId,
      preferredLanguage
    );

    const poster =
      bestPoster(imageData.posters, preferredLanguage);

    const posterPath =
      poster?.file_path ||
      details.poster_path ||
      "";

    metadata[movie.title] = {
      ...entry,
      year: movie.year,
      aliases: Array.isArray(entry.aliases)
        ? entry.aliases
        : [],
      ...(posterPath
        ? { poster: `${IMAGE_BASE}${posterPath}` }
        : {}),
      tmdbId: String(tmdbId),
      posterLanguage: preferredLanguage
    };
  } catch (error) {
    failures.push({
      title: movie.title,
      year: movie.year,
      error:
        error instanceof Error
          ? error.message
          : String(error)
    });

    process.stderr.write(
      `Poster lookup failed for ${movie.title}: ${
        error instanceof Error
          ? error.message
          : String(error)
      }\n`
    );
  }

  await delay(80);
}

const output =
  `// Generated/maintained with TMDB API poster metadata.\n` +
  `window.WLW_MOVIE_METADATA = ${JSON.stringify(
    metadata,
    null,
    2
  )};\n`;

await fs.writeFile(
  "movie-metadata.js",
  output,
  "utf8"
);

await fs.writeFile(
  "tmdb-poster-review.json",
  `${JSON.stringify(failures, null, 2)}\n`,
  "utf8"
);

console.log(
  `Updated poster metadata for ${movies.length - failures.length}/${movies.length} catalog titles.`
);

if (failures.length) {
  console.warn(
    `${failures.length} title(s) need review. See tmdb-poster-review.json.`
  );
}
