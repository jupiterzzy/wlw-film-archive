const params =
  new URLSearchParams(
    location.search
  );


let code =
  (
    params.get("code") ||
    ""
  ).toUpperCase();


/*
  只在手机端启用 fallback。
  电脑和平板仍然完全使用 URL query。
*/
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
  () => {
    location.reload();
  }
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


  /*
    ==================================================
    IMPORTANT

    非美国页面：
    直接从 DOM 删除整个年份筛选栏。

    因此 UK / Germany / France / etc.
    不可能因为 CSS 覆盖 hidden 而显示年份控件。
    ==================================================
  */

  if (!isUSA) {
    yearControls.remove();
  }


  let movies =
    [
      ...group.movies
    ];


  /*
    ==================================================
    USA ONLY
    ==================================================
  */

  if (isUSA) {

    /*
      USA 页面才真正显示年份控件。
    */
    yearControls.hidden =
      false;


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


    /*
      生成 USA 排序按钮链接。
    */
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


    /*
      USA 年份范围提交。
    */
    rangeForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        let nextFrom =
          Number.parseInt(
            fromInput.value,
            10
          );


        let nextTo =
          Number.parseInt(
            toInput.value,
            10
          );


        if (
          !Number.isFinite(
            nextFrom
          )
        ) {
          nextFrom = null;
        }


        if (
          !Number.isFinite(
            nextTo
          )
        ) {
          nextTo = null;
        }


        /*
          如果用户反着输入：
          1998 → 1988
          自动转换成：
          1988 → 1998
        */
        if (
          nextFrom !== null &&
          nextTo !== null &&
          nextFrom > nextTo
        ) {

          [
            nextFrom,
            nextTo
          ] = [
            nextTo,
            nextFrom
          ];

        }


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
          nextFrom !== null
        ) {

          nextParams.set(
            "from",
            nextFrom
          );

        }


        if (
          nextTo !== null
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


    /*
      年份范围筛选。
      首尾年份都包含。
    */
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


    /*
      USA 专属年份排序。
    */
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


        if (
          sort === "asc"
        ) {

          return (
            yearDifference ||
            titleDifference
          );

        }


        return (
          -yearDifference ||
          titleDifference
        );

      }
    );


    /*
      ==================================================
      USA PAGINATION
      ==================================================
    */

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

            renderMovie(
              movie
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
          "USA"
        );


        pageParams.set(
          "page",
          value
        );


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


        return (
          `./country.html?${pageParams.toString()}`
        );

      }
    );

  } else {

    /*
      ==================================================
      ALL OTHER COUNTRIES

      保持原来的国家页面逻辑。
      不排序。
      不加年份筛选。
      不读取 from / to / sort。
      ==================================================
    */

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

          renderMovie(
            movie
          );

        }
      );


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


        return (
          `./country.html?${pageParams.toString()}`
        );

      }
    );

  }

}


/*
  ==================================================
  SHARED MOVIE CARD RENDERER
  ==================================================
*/

function renderMovie(
  movie
) {

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
