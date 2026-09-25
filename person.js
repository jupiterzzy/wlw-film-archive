(function () {
  const params =
    new URLSearchParams(
      location.search
    );

  const personId =
    params.get("id") || "";

  const personName =
    document.querySelector(
      "#person-name"
    );

  const personSummary =
    document.querySelector(
      "#person-summary"
    );

  const personError =
    document.querySelector(
      "#person-error"
    );

  const movieContainer =
    document.querySelector(
      "#person-movies"
    );

  const template =
    document.querySelector(
      "#person-movie-template"
    );

  const back =
    document.querySelector(
      "#person-back"
    );

  if (
    document.referrer &&
    document.referrer.startsWith(
      location.origin
    )
  ) {
    back.addEventListener(
      "click",
      event => {
        event.preventDefault();
        history.back();
      }
    );
  }

  function showError(message) {
    personName.textContent =
      "演员";

    personSummary.hidden =
      true;

    movieContainer.replaceChildren();

    personError.textContent =
      message;

    personError.hidden =
      false;
  }

  if (!personId) {
    showError(
      "没有提供演员 ID。"
    );
    return;
  }

  const detailsByTitle =
    window.WLW_TMDB_DETAILS || {};

  const entries =
    Object.entries(
      detailsByTitle
    );

  const hasGeneratedCast =
    entries.some(
      ([, details]) =>
        Array.isArray(details.cast)
    );

  if (!hasGeneratedCast) {
    showError(
      "演员索引尚未生成。请先运行 Update TMDB detail data 工作流程。"
    );
    return;
  }

  const matches =
    entries.filter(
      ([, details]) =>
        (details.cast || []).some(
          person =>
            String(person.id) ===
            String(personId)
        )
    );

  if (!matches.length) {
    showError(
      "这个演员目前没有匹配到本 Archive 中的电影。"
    );
    return;
  }

  let matchedPerson =
    null;

  for (const [, details] of matches) {
    matchedPerson =
      (details.cast || []).find(
        person =>
          String(person.id) ===
          String(personId)
      );

    if (matchedPerson) {
      break;
    }
  }

  const displayName =
    matchedPerson?.name ||
    "演员";

  personName.textContent =
    displayName;

  document.title =
    `${displayName} · WLW Film Archive`;

  personSummary.textContent =
  matches.length > 1
    ? `More with ${displayName}`
    : `目前没有 ${displayName} 的更多电影`;

personSummary.hidden =
  false;

  const catalogMovieByTitle =
    new Map();

  Object.values(
    window.WLW_CATALOG || {}
  )
    .flatMap(
      group =>
        group.movies || []
    )
    .forEach(movie => {
      if (
        !catalogMovieByTitle.has(
          movie.title
        )
      ) {
        catalogMovieByTitle.set(
          movie.title,
          movie
        );
      }
    });

  matches.forEach(
    ([title, details]) => {
      const movie =
        catalogMovieByTitle.get(
          title
        );

      if (!movie) {
        return;
      }

      const card =
        template.content
          .firstElementChild
          .cloneNode(true);

      const titleLink =
        card.querySelector(
          "h3 a"
        );

      const meta =
        card.querySelector(
          ".movie-meta"
        );

      titleLink.textContent =
        movie.title;

      const genres =
        (details.genres || [])
          .map(item =>
            typeof item === "string"
              ? item
              : item.name
          )
          .filter(Boolean);

      meta.textContent =
        [
          details.year ||
            movie.year,
          ...genres
        ]
          .filter(Boolean)
          .join(" • ");

      window.applyWLWPoster(
        card,
        movie
      );

      movieContainer.appendChild(
        card
      );
    }
  );
})();
