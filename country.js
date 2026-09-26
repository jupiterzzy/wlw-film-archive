const params =
  new URLSearchParams(
    location.search
  );

let code =
  (
    params.get("code") ||
    ""
  ).toUpperCase();


/* 只在手机端启用 fallback。
   电脑和平板仍然完全使用原来的 URL query。 */
if (
  !code &&
  matchMedia(
    "(max-width: 38rem)"
  ).matches
) {
  code =
    (
      sessionStorage.getItem(
        "wlw-mobile-country-code"
      ) ||
      ""
    ).toUpperCase();
}


const group =
  window.WLW_CATALOG[
    code
  ];


const requestedPage =
  Math.max(
    1,
    Number.parseInt(
      params.get("page") ||
      "1",
      10
    ) || 1
  );


const desktopLayout =
  matchMedia(
    "(min-width: 1024px) and (hover: hover) and (pointer: fine)"
  );


const pageSize =
  desktopLayout.matches
    ? 36
    : 20;


desktopLayout.addEventListener?.(
  "change",
  () =>
    location.reload()
);


const title =
  document.querySelector(
    "#listing-title"
  );

const grid =
  document.querySelector(
    "#listing-grid"
  );

const template =
  document.querySelector(
    "#listing-card-template"
  );

const pagination =
  document.querySelector(
    "#listing-pagination"
  );


const yearControls =
  document.querySelector(
    "#country-year-controls"
  );

const ascending =
  document.querySelector(
    "#country-ascending"
  );

const descending =
  document.querySelector(
    "#country-descending"
  );

const rangeForm =
  document.querySelector(
    "#country-year-range-form"
  );

const fromInput =
  document.querySelector(
    "#country-year-from"
  );

const toInput =
  document.querySelector(
    "#country-year-to"
  );


title.classList.add(
  "compact-category-title"
);

grid.classList.add(
  "desktop-six-by-six"
);


if (!group) {

  title.textContent =
    "未找到";

  grid.innerHTML =
    '<p class="empty-listing">没有找到这个国家或地区。请返回目录重新选择。</p>';

} else {

  document.title =
    `${group.title} · WLW Film Archive`;

  title.textContent =
    group.title;


  const isUSA =
    code === "USA";


  let sort =
    params.get("sort") ===
    "desc"
      ? "desc"
      : "asc";


  let fromYear =
    Number.parseInt(
      params.get("from") ||
      "",
      10
    );


  let toYear =
    Number.parseInt(
      params.get("to") ||
      "",
      10
    );


  if (
    !Number.isFinite(
      fromYear
    )
  ) {
    fromYear = null;
  }


  if (
    !Number.isFinite(
      toYear
    )
  ) {
    toYear = null;
  }


  if (
    fromYear !== null &&
    toYear !== null &&
    fromYear > toYear
  ) {
    [
      fromYear,
      toYear
    ] = [
      toYear,
      fromYear
    ];
  }


  let movies =
    [
      ...group.movies
    ];


  /* ==================================================
     USA ONLY
     ================================================== */

  if (isUSA) {

    yearControls.hidden =
      false;


    document
      .querySelector(
        sort === "asc"
          ? "#country-ascending"
          : "#country-descending"
      )
      .classList.add(
        "active"
      );


    if (
      fromYear !== null
    ) {
      fromInput.value =
        fromYear;
    }


    if (
      toYear !== null
    ) {
      toInput.value =
        toYear;
    }


    function makeUSAHref(
      nextSort
    ) {

      const nextParams =
        new URLSearchParams();


      nextParams.set(
        "code",
        "USA"
      );


      nextParams.set(
        "sort",
        nextSort
      );


      if (
        fromYear !== null
      ) {
        nextParams.set(
          "from",
          fromYear
        );
      }


      if (
        toYear !== null
      ) {
        nextParams.set(
          "to",
          toYear
        );
      }


      return (
        `./country.html?${nextParams.toString()}`
      );
    }


    ascending.href =
      makeUSAHref(
        "asc"
      );


    descending.href =
      makeUSAHref(
        "desc"
      );


    rangeForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const nextFrom =
          Number.parseInt(
            fromInput.value,
            10
          );


        const nextTo =
          Number.parseInt(
            toInput.value,
            10
          );


        const nextParams =
          new URLSearchParams();


        nextParams.set(
          "code",
          "USA"
        );


        nextParams.set(
          "sort",
          sort
        );


        if (
          Number.isFinite(
            nextFrom
          )
        ) {
          nextParams.set(
            "from",
            nextFrom
          );
        }


        if (
          Number.isFinite(
            nextTo
          )
        ) {
          nextParams.set(
            "to",
            nextTo
          );
        }


        location.href =
          `./country.html?${nextParams.toString()}`;

      }
    );


    if (
      fromYear !== null
    ) {

      movies =
        movies.filter(
          movie =>
            Number(
              movie.year
            ) >=
            fromYear
        );

    }


    if (
      toYear !== null
    ) {

      movies =
        movies.filter(
          movie =>
            Number(
              movie.year
            ) <=
            toYear
        );

    }


    movies.sort(
      (
        a,
        b
      ) => {

        const yearDifference =
          Number(
            a.year
          ) -
          Number(
            b.year
          );


        const titleDifference =
          a.title.localeCompare(
            b.title,
            "en",
            {
              sensitivity:
                "base"
            }
          );


        return (
          sort === "asc"
            ? (
                yearDifference ||
                titleDifference
              )
            : (
                -yearDifference ||
                titleDifference
              )
        );
      }
    );

  }


  /* ==================================================
     PAGINATION
     ================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        movies.length /
        pageSize
      )
    );


  const page =
    Math.min(
      requestedPage,
      totalPages
    );


  if (
    !movies.length
  ) {

    grid.innerHTML =
      '<p class="empty-listing">这个年份范围内没有电影。</p>';

  } else {

    movies
      .slice(
        (
          page -
          1
        ) *
        pageSize,

        page *
        pageSize
      )
      .forEach(
        movie => {

          const node =
            template.content
              .cloneNode(
                true
              );


          node
            .querySelector(
              "h3 a"
            )
            .textContent =
              movie.title;


          const genres =
            window
              .getWLWGenres(
                movie.title
              );


          const meta =
            node.querySelector(
              ".movie-meta"
            );


          meta.innerHTML =
            `<span class="movie-year">${movie.year}</span>` +
            (
              genres.length
                ? `<span class="movie-genres">${genres
                    .slice(
                      0,
                      2
                    )
                    .join(
                      " • "
                    )}</span>`
                : ""
            );


          window.applyWLWPoster(
            node,
            movie
          );


          grid.appendChild(
            node
          );

        }
      );

  }


  window.makePagination(
    pagination,
    totalPages,
    page,
    value => {

      const pageParams =
        new URLSearchParams();


      pageParams.set(
        "code",
        code
      );


      pageParams.set(
        "page",
        value
      );


      if (isUSA) {

        pageParams.set(
          "sort",
          sort
        );


        if (
          fromYear !== null
        ) {
          pageParams.set(
            "from",
            fromYear
          );
        }


        if (
          toYear !== null
        ) {
          pageParams.set(
            "to",
            toYear
          );
        }

      }


      return (
        `./country.html?${pageParams.toString()}`
      );
    }
  );

}
