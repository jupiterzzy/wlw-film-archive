(function () {
  const catalog = window.WLW_CATALOG || {};
  const detailsByTitle = window.WLW_TMDB_DETAILS || {};
  const allMovies = Object.values(catalog).flatMap(group =>
    (group.movies || []).map(movie => ({
      ...movie,
      aliases: window.getWLWAliases?.(movie.title) || [],
      cast: (window.WLW_CAST_SEARCH_INDEX?.[movie.title] || detailsByTitle[movie.title]?.femaleCast || []).map(person =>
        typeof person === "string" ? { name: person } : person
      )
    }))
  );

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&|\band\b/g, " and ")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 3;
    let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i += 1) {
      const current = [i];
      for (let j = 1; j <= b.length; j += 1) {
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
      previous = current;
    }
    return previous[b.length];
  }

  function textScore(candidate, query) {
    if (!candidate || !query) return 0;
    if (candidate === query) return 120;
    if (candidate.startsWith(query)) return 105;
    if (candidate.includes(query)) return 90;

    const queryWords = query.split(" ");
    const candidateWords = candidate.split(" ");
    if (queryWords.every(word => candidateWords.some(part => part.startsWith(word)))) return 78;

    // Tolerate small typos while retaining a relevance order.
    const bestDistance = Math.min(...candidateWords.map(word => editDistance(word, query)));
    if (query.length >= 4 && bestDistance <= 1) return 58;
    if (query.length >= 6 && bestDistance <= 2) return 42;
    return 0;
  }

  function scoreMovie(movie, query) {
    const titleCandidates = [movie.title, ...movie.aliases].map(normalize);
    let score = Math.max(0, ...titleCandidates.map(candidate => textScore(candidate, query)));

    // Cast matches return the movies in this archive featuring that performer.
    for (const person of movie.cast) {
      score = Math.max(score, textScore(normalize(person.name), query));
    }
    return score;
  }

  function movieHref(movie) {
    return `./movie.html?title=${encodeURIComponent(movie.title)}`;
  }

  function attachSearch(formId, inputId, resultsId) {
    const form = document.getElementById(formId);
    const input = document.getElementById(inputId);
    const resultsBox = document.getElementById(resultsId);
    if (!form || !input || !resultsBox) return;

    function render(rawQuery) {
      const query = normalize(rawQuery);
      resultsBox.replaceChildren();
      if (!query) {
        resultsBox.hidden = true;
        input.setAttribute("aria-expanded", "false");
        return [];
      }

      const results = allMovies
        .map(movie => ({ movie, score: scoreMovie(movie, query) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score || a.movie.title.localeCompare(b.movie.title))
        .slice(0, 12)
        .map(item => item.movie);

      if (!results.length) {
        const empty = document.createElement("p");
        empty.className = "empty-result";
        empty.textContent = "没有找到匹配的电影或演员";
        resultsBox.appendChild(empty);
      } else {
        results.forEach(movie => {
          const link = document.createElement("a");
          link.className = "search-result";
          link.href = movieHref(movie);
          link.setAttribute("role", "option");
          const title = document.createElement("span");
          title.textContent = movie.title;
          const year = document.createElement("span");
          year.textContent = movie.year || "";
          link.append(title, year);
          resultsBox.appendChild(link);
        });
      }

      resultsBox.hidden = false;
      input.setAttribute("aria-expanded", "true");
      return results;
    }

    input.addEventListener("input", event => render(event.target.value));
    form.addEventListener("submit", event => {
      event.preventDefault();
      const matches = render(input.value);
      if (matches.length === 1) location.href = movieHref(matches[0]);
    });
    document.addEventListener("click", event => {
      if (!form.contains(event.target)) {
        resultsBox.hidden = true;
        input.setAttribute("aria-expanded", "false");
      }
    });
  }

  attachSearch("search-form", "film-search", "search-results");
  attachSearch("detail-search-form", "detail-film-search", "detail-search-results");
})();
