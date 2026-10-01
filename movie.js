(function () {
  const params = new URLSearchParams(location.search);
  const requestedTitle = params.get("title") || "";

  const catalogGroups = Object.values(
    window.WLW_CATALOG || {}
  );

  const catalogMovies = catalogGroups.flatMap(
    group =>
      group.movies.map(movie => ({
        ...movie,
        catalogGroup: group.title,
        catalogType: group.type
      }))
  );

  const movie = catalogMovies.find(
    item => item.title === requestedTitle
  );

  const metadata = movie
    ? window.getWLWMetadata(movie.title)
    : {};

  const details = movie
    ? (window.WLW_TMDB_DETAILS || {})[
        movie.title
      ] ||
      (
        metadata.tmdbId
          ? (
              window.WLW_TMDB_DETAILS_BY_ID ||
              {}
            )[String(metadata.tmdbId)]
          : null
      )
    : null;

  const translations =
    window.WLW_SYNOPSIS_TRANSLATIONS || {};

  const loading =
    document.querySelector(
      "#detail-loading"
    );

  const article =
    document.querySelector(
      "#detail-article"
    );

  const error =
    document.querySelector(
      "#detail-error"
    );

  const errorMessage =
    document.querySelector(
      "#detail-error-message"
    );

  function showError(message) {
    loading.hidden = true;
    article.hidden = true;
    errorMessage.textContent = message;
    error.hidden = false;
  }

  if (!movie) {
    showError(
      "没有找到这部电影。请从电影列表重新进入详情页。"
    );
    return;
  }

  if (!details) {
    showError(
      "TMDB 资料尚未生成。请先运行仓库中的 Update TMDB detail data 工作流程。"
    );
    return;
  }

/*
  ==================================================
  LESMAS CHRISTMAS EFFECT
  ==================================================

  This effect belongs to the LesMas collection itself.

  No movie title is hard-coded here.
  Any movie added to the "lesmas" collection in
  collection-data.js automatically receives the effect.
*/

function movieBelongsToCollection(
  collectionSlug,
  movieTitle
) {
  const collections =
    window.WLW_COLLECTIONS ||
    [];

  const collection =
    collections.find(
      item =>
        item.slug ===
        collectionSlug
    );

  if (
    !collection ||
    !Array.isArray(
      collection.movies
    )
  ) {
    return false;
  }

  return collection.movies.includes(
    movieTitle
  );
}


/*
  Create one SVG Santa hat.

  SVG is used instead of separate CSS shapes so the
  red cap, white fur and pom-pom remain connected
  correctly while the hat rotates and falls.
*/
function createLesMasSantaHat() {
  const hat =
    document.createElement(
      "span"
    );

  hat.className =
    "lesmas-hat";

  hat.innerHTML = `
    <svg
      class="lesmas-hat-svg"
      viewBox="0 0 140 105"
      aria-hidden="true"
      focusable="false"
    >
      <defs>

        <linearGradient
          id="lesmasHatRed"
          x1="18"
          y1="18"
          x2="104"
          y2="84"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stop-color="#ff314f"
          />

          <stop
            offset="38%"
            stop-color="#dc1738"
          />

          <stop
            offset="72%"
            stop-color="#b5082a"
          />

          <stop
            offset="100%"
            stop-color="#790419"
          />
        </linearGradient>


        <linearGradient
          id="lesmasHatHighlight"
          x1="45"
          y1="24"
          x2="76"
          y2="70"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stop-color="#ffffff"
            stop-opacity=".42"
          />

          <stop
            offset="100%"
            stop-color="#ffffff"
            stop-opacity="0"
          />
        </linearGradient>


        <linearGradient
          id="lesmasHatFur"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="#ffffff"
          />

          <stop
            offset="55%"
            stop-color="#f7f4ef"
          />

          <stop
            offset="100%"
            stop-color="#d8d3cf"
          />
        </linearGradient>


        <radialGradient
          id="lesmasHatPom"
          cx="35%"
          cy="28%"
          r="70%"
        >
          <stop
            offset="0%"
            stop-color="#ffffff"
          />

          <stop
            offset="60%"
            stop-color="#f4f1ed"
          />

          <stop
            offset="100%"
            stop-color="#cec9c6"
          />
        </radialGradient>


        <filter
          id="lesmasHatShadow"
          x="-40%"
          y="-40%"
          width="180%"
          height="190%"
        >
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="4"
            flood-color="#000000"
            flood-opacity=".34"
          />
        </filter>


        <filter
          id="lesmasHatSoftShadow"
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="2"
            flood-color="#000000"
            flood-opacity=".25"
          />
        </filter>

      </defs>


      <!-- Main red cap -->
      <path
        d="
          M 20 78
          C 28 57, 39 36, 57 21
          C 71 9, 86 8, 105 18
          C 94 23, 85 31, 80 41
          C 73 53, 69 66, 67 78
          Z
        "
        fill="url(#lesmasHatRed)"
        filter="url(#lesmasHatShadow)"
      />


      <!-- Folded tip connecting the cap to the pom-pom -->
      <path
        d="
          M 80 41
          C 86 31, 94 23, 105 18
          C 112 20, 117 25, 119 31
          C 108 30, 99 34, 91 43
          Z
        "
        fill="#b5082a"
      />


      <!-- Soft fabric highlight -->
      <path
        d="
          M 39 64
          C 45 45, 53 29, 67 19
          C 73 15, 80 13, 86 14
        "
        fill="none"
        stroke="url(#lesmasHatHighlight)"
        stroke-width="7"
        stroke-linecap="round"
      />


      <!-- Subtle lower fabric shadow -->
      <path
        d="
          M 25 75
          C 37 70, 52 68, 67 70
        "
        fill="none"
        stroke="#650315"
        stroke-opacity=".28"
        stroke-width="5"
        stroke-linecap="round"
      />


      <!-- White furry band -->
      <path
        d="
          M 16 73
          C 27 69, 41 69, 54 70
          C 61 70, 69 71, 75 74
          C 78 77, 77 84, 73 87
          C 58 91, 35 90, 18 87
          C 12 85, 11 77, 16 73
          Z
        "
        fill="url(#lesmasHatFur)"
        filter="url(#lesmasHatSoftShadow)"
      />


      <!-- Fur texture -->
      <path
        d="
          M 20 78
          C 27 75, 32 80, 38 77
          C 44 74, 50 80, 56 77
          C 62 74, 67 79, 72 77
        "
        fill="none"
        stroke="#ffffff"
        stroke-opacity=".74"
        stroke-width="2.5"
        stroke-linecap="round"
      />


      <!-- Pom-pom at the actual tip -->
      <circle
        cx="120"
        cy="31"
        r="13"
        fill="url(#lesmasHatPom)"
        filter="url(#lesmasHatSoftShadow)"
      />


      <!-- Pom-pom highlight -->
      <circle
        cx="116"
        cy="27"
        r="4"
        fill="#ffffff"
        opacity=".72"
      />

    </svg>
  `;

  return hat;
}


function startLesMasChristmasEffect() {
  /*
    Prevent duplicate layers.
  */
  if (
    document.querySelector(
      ".lesmas-effect-layer"
    )
  ) {
    return;
  }


  /*
    Respect reduced-motion preference.
  */
  if (
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
  ) {
    return;
  }


  const layer =
    document.createElement(
      "div"
    );

  layer.className =
    "lesmas-effect-layer";

  layer.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.appendChild(
    layer
  );


  /*
    ==================================================
    SNOW
    ==================================================

    Slightly fewer flakes than before so the page
    feels festive without covering the movie content.
  */
  for (
    let index = 0;
    index < 34;
    index += 1
  ) {
    const snowflake =
      document.createElement(
        "span"
      );

    snowflake.className =
      "lesmas-snowflake";

    snowflake.textContent =
      "❄";

    snowflake.style.setProperty(
      "--x",
      `${Math.random() * 100}vw`
    );

    snowflake.style.setProperty(
      "--drift",
      `${Math.random() * 14 - 7}vw`
    );

    snowflake.style.setProperty(
      "--duration",
      `${5.5 + Math.random() * 4.5}s`
    );

    snowflake.style.setProperty(
      "--delay",
      `${Math.random() * -8}s`
    );

    snowflake.style.setProperty(
      "--size",
      `${0.5 + Math.random() * 0.9}rem`
    );

    snowflake.style.setProperty(
      "--opacity",
      `${0.28 + Math.random() * 0.52}`
    );

    snowflake.style.setProperty(
      "--spin",
      `${180 + Math.random() * 260}deg`
    );

    layer.appendChild(
      snowflake
    );
  }


  /*
    ==================================================
    SANTA HATS
    ==================================================

    Use fewer, better-looking hats.
  */
  for (
    let index = 0;
    index < 7;
    index += 1
  ) {
    const hat =
      createLesMasSantaHat();

    hat.style.setProperty(
      "--x",
      `${4 + Math.random() * 90}vw`
    );

    hat.style.setProperty(
      "--drift",
      `${Math.random() * 16 - 8}vw`
    );

    hat.style.setProperty(
      "--duration",
      `${6 + Math.random() * 3.5}s`
    );

    hat.style.setProperty(
      "--delay",
      `${Math.random() * -5}s`
    );

    hat.style.setProperty(
      "--size",
      `${2.6 + Math.random() * 1.5}rem`
    );

    hat.style.setProperty(
  "--rotation",
  `${Math.random() * 24 - 12}deg`
);

    hat.style.setProperty(
      "--hat-spin",
      `${90 + Math.random() * 100}deg`
    );

    layer.appendChild(
      hat
    );
  }


  /*
    Let the effect run briefly, then fade away.
  */
  window.setTimeout(
    () => {
      layer.classList.add(
        "is-ending"
      );
    },
    6800
  );


  window.setTimeout(
    () => {
      layer.remove();
    },
    8100
  );
}


if (
  movieBelongsToCollection(
    "lesmas",
    movie.title
  )
) {
  startLesMasChristmasEffect();
}
  
  const poster =
    document.querySelector(
      "#detail-poster"
    );

  const detailTitle =
    document.querySelector(
      "#detail-title"
    );

  const detailMeta =
    document.querySelector(
      "#detail-meta"
    );

  const movieInformation =
    document.querySelector(
      ".movie-information"
    );

  function placeMovieTitle() {
  const desktop = window.matchMedia("(min-width: 48rem)").matches;

  if (desktop) {
    movieInformation.insertBefore(detailTitle, detailMeta);
  } else {
    poster.insertAdjacentElement("afterend", detailTitle);
  }
}

  detailTitle.textContent =
    movie.title;

  placeMovieTitle();

  window.addEventListener(
    "resize",
    placeMovieTitle
  );

  poster.src =
    window.getWLWPoster(movie);

  poster.alt =
    `${movie.title} 电影海报`;

  poster.addEventListener(
    "error",
    () => {
      poster.src =
        window.getWLWPlaceholderPoster?.(
          movie.title
        ) || poster.src;
    },
    { once: true }
  );

  document.title =
    `${movie.title} · WLW Film Archive`;

  const detailBack =
    document.querySelector(
      ".detail-back"
    );

  const backLetter =
    movie.title
      .replace(/^the\s+/i, "")
      .trim()
      .charAt(0)
      .toUpperCase() || "A";

  let referrer = null;

  try {
    referrer =
      document.referrer
        ? new URL(document.referrer)
        : null;
  } catch {
    referrer = null;
  }

  const sameSiteReferrer =
    referrer &&
    referrer.origin === location.origin;

  const cameFromAlphabet =
    sameSiteReferrer &&
    referrer.pathname.endsWith(
      "/alphabet.html"
    );

  if (cameFromAlphabet) {
    detailBack.href =
      backLetter === "A"
        ? "./alphabet.html"
        : `./alphabet.html?letter=${encodeURIComponent(backLetter)}`;

    detailBack.textContent =
      `← ${backLetter}`;

    detailBack.setAttribute(
      "aria-label",
      `返回 ${backLetter} 字母电影列表`
    );
  } else if (sameSiteReferrer) {
    detailBack.href =
      referrer.href;

    detailBack.textContent =
      "←";

    detailBack.setAttribute(
      "aria-label",
      "返回上一页"
    );

    detailBack.addEventListener(
      "click",
      event => {
        event.preventDefault();
        history.back();
      }
    );
  } else {
    detailBack.href =
      "./index.html";

    detailBack.textContent =
      "←";

    detailBack.setAttribute(
      "aria-label",
      "返回首页"
    );
  }

  const year =
    details.year ||
    metadata.year ||
    movie.year;

  const genres =
    (details.genres || [])
      .map(item =>
        typeof item === "string"
          ? item
          : item.name
      )
      .filter(Boolean);

  document.querySelector(
    "#detail-meta"
  ).textContent =
    [year, ...genres]
      .filter(Boolean)
      .join(" • ");

  const synopsis =
    document.querySelector(
      "#synopsis"
    );

  const english =
    document.createElement("p");

  english.className =
    "synopsis-en";

  english.lang = "en";

  english.textContent =
    details.overview ||
    "No English synopsis is currently available from TMDB.";

  synopsis.appendChild(
    english
  );

  const translation =
    translations[
      String(details.tmdbId)
    ] ||
    translations[movie.title];

  if (
    details.originalLanguage === "en" &&
    translation
  ) {
    const chinese =
      document.createElement("p");

    chinese.className =
      "synopsis-zh";

    chinese.lang = "zh-CN";

    chinese.textContent =
      translation;

    synopsis.appendChild(
      chinese
    );
  }

  /*
   * Resources
   *
   * 所有电影都会显示资源栏。
   * 百度网盘提取码统一由
   * movie-resources.js 中的
   * defaultCode 控制。
   */

  const resourceSection =
    document.querySelector(
      "#resource-information"
    );

  const resourceList =
    document.querySelector(
      "#resource-list"
    );

  const resourceData =
    window.WLW_MOVIE_RESOURCES || {};

  const baiduUrl =
    resourceData.baidu?.[
      movie.title
    ] || "";

  const defaultCode =
    resourceData.defaultCode ||
    "yuri";

  resourceSection.hidden = false;

  const resourceItem =
    document.createElement("div");

  resourceItem.className =
    "resource-item";

  const resourceInfo =
    document.createElement("div");

  resourceInfo.className =
    "resource-info";

  const provider =
    document.createElement("span");

  provider.className =
    "resource-provider";

  provider.textContent =
    "百度网盘";

  resourceInfo.appendChild(
    provider
  );

  const code =
    document.createElement("span");

  code.className =
    "resource-code";

  code.textContent =
    `提取码：${defaultCode}`;

  resourceInfo.appendChild(
    code
  );

  resourceItem.appendChild(
    resourceInfo
  );

  if (baiduUrl) {
    const resourceLink =
      document.createElement("a");

    resourceLink.className =
      "resource-link";

    resourceLink.href =
      baiduUrl;

    resourceLink.target =
      "_blank";

    resourceLink.rel =
      "noopener noreferrer";

    resourceLink.textContent =
      "获取资源";

    resourceItem.appendChild(
      resourceLink
    );
  } else {
    const unavailable =
      document.createElement("span");

    unavailable.className =
      "resource-link resource-link-unavailable";

    unavailable.textContent =
      "暂未添加";

    resourceItem.appendChild(
      unavailable
    );
  }

  resourceList.appendChild(
    resourceItem
  );

  /*
   * Cast
   */

  const castList =
    document.querySelector(
      "#cast-list"
    );

  const castOverride =
    (
      window.WLW_CAST_OVERRIDES ||
      {}
    )[movie.title] || {};

  const excludedIds =
    new Set(
      (castOverride.exclude || [])
        .map(String)
    );

  const femaleCast = [
    ...(details.femaleCast || []),
    ...(castOverride.include || [])
  ]
    .filter(
      person =>
        !excludedIds.has(
          String(person.id)
        )
    )
    .filter(
      (person, index, items) =>
        items.findIndex(
          item =>
            String(item.id) ===
            String(person.id)
        ) === index
    )
    .sort(
      (a, b) =>
        (a.order ?? 9999) -
        (b.order ?? 9999)
    );

  if (femaleCast.length) {
    femaleCast.forEach(person => {
      const member =
        document.createElement("a");

      member.className =
        "cast-member";

      member.href =
        `./person.html?id=${encodeURIComponent(person.id)}&role=cast`;

      member.setAttribute(
        "aria-label",
        `查看 ${person.name} 在本 Archive 中出演的电影`
      );

      member.style.color =
        "inherit";

      member.style.textDecoration =
        "none";

      if (person.profilePath) {
        const photo =
          document.createElement("img");

        photo.className =
          "cast-photo";

        photo.src =
          `https://image.tmdb.org/t/p/w342${person.profilePath}`;

        photo.alt =
          person.name;

        photo.loading =
          "lazy";

        photo.addEventListener(
          "error",
          () => photo.remove(),
          { once: true }
        );

        member.appendChild(
          photo
        );
      } else {
        const placeholder =
          document.createElement("div");

        placeholder.className =
          "cast-photo cast-photo-placeholder";

        placeholder.setAttribute(
          "aria-hidden",
          "true"
        );

        member.appendChild(
          placeholder
        );
      }

      const name =
        document.createElement("span");

      name.className =
        "cast-name";

      name.textContent =
        person.name;

      member.appendChild(
        name
      );

      const role =
        document.createElement("span");

      role.className =
        "cast-role";

      role.textContent =
        person.character || "—";

      member.appendChild(
        role
      );

      castList.appendChild(
        member
      );
    });
  }

  /*
   * Crew
   */

  const crewList =
    document.querySelector(
      "#crew-list"
    );

  const crew =
    details.crew || [];

  crew.forEach(person => {
    const jobs =
      Array.isArray(person.jobs)
        ? person.jobs
        : [person.job].filter(Boolean);

    const personRole =
      jobs.includes("Director")
        ? "director"
        : "writer";

    const member =
      document.createElement("a");

    member.className =
      "crew-member";

    member.href =
      `./person.html?id=${encodeURIComponent(person.id)}&role=${personRole}`;

    member.setAttribute(
      "aria-label",
      personRole === "director"
        ? `查看 ${person.name} 在本 Archive 中执导的电影`
        : `查看 ${person.name} 在本 Archive 中编写的电影`
    );

    member.style.color =
      "inherit";

    member.style.textDecoration =
      "none";

    if (person.profilePath) {
      const photo =
        document.createElement("img");

      photo.className =
        "crew-photo";

      photo.src =
        `https://image.tmdb.org/t/p/w342${person.profilePath}`;

      photo.alt =
        person.name;

      photo.loading =
        "lazy";

      photo.addEventListener(
        "error",
        () => photo.remove(),
        { once: true }
      );

      member.appendChild(
        photo
      );
    } else {
      const placeholder =
        document.createElement("div");

      placeholder.className =
        "crew-photo crew-photo-placeholder";

      placeholder.setAttribute(
        "aria-hidden",
        "true"
      );

      member.appendChild(
        placeholder
      );
    }

    const name =
      document.createElement("span");

    name.className =
      "crew-name";

    name.textContent =
      person.name;

    member.appendChild(
      name
    );

    const role =
      document.createElement("span");

    role.className =
      "crew-role";

    const isDirector =
      jobs.includes("Director");

    const isWriter =
      jobs.some(job =>
        [
          "Screenplay",
          "Writer",
          "Story",
          "Teleplay",
          "Adaptation"
        ].includes(job)
      );

    role.textContent =
      isDirector && isWriter
        ? "Director · Writer"
        : isDirector
          ? "Director"
          : "Writer";

    member.appendChild(
      role
    );

    crewList.appendChild(
      member
    );
  });

  loading.hidden = true;
  article.hidden = false;
})();
