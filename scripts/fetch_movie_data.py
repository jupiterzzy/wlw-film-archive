import json
import os
import sys
import time
from pathlib import Path

import requests


# ============================================================
# Configuration
# ============================================================

API_KEY = os.environ.get("TMDB_API_KEY")

if not API_KEY:
    print("ERROR: TMDB_API_KEY is not configured.")
    sys.exit(1)

BASE_URL = "https://api.themoviedb.org/3"
IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original"

# Output directory
DATA_DIR = Path("data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = DATA_DIR / "tmdb_details.json"


# ============================================================
# A-letter films currently used for the detail-page test
#
# If your repository already has a different A-film list,
# this list can be updated later without changing the API logic.
# ============================================================

MOVIES = [
    "A Date for Mad Mary",
    "A Fantastic Woman",
    "A Girl at My Door",
    "A Marine Story",
    "A Perfect Ending",
    "Aimee & Jaguar",
    "Alena",
    "Alice Júnior",
    "All About E",
    "All Over Me",
    "Almost Adults",
    "Ammonite",
    "Anaïs in Love",
    "Anatomy of a Love Seen",
    "And Then Came Lola",
    "Anne+",
    "Appropriate Behavior",
    "AWOL",
]


# ============================================================
# TMDB helpers
# ============================================================

def tmdb_get(endpoint, params=None):
    if params is None:
        params = {}

    params["api_key"] = API_KEY

    url = f"{BASE_URL}{endpoint}"

    response = requests.get(
        url,
        params=params,
        timeout=30
    )

    if response.status_code != 200:
        print(
            f"TMDB request failed: "
            f"{response.status_code} {response.url}"
        )
        print(response.text)
        return None

    return response.json()


def search_movie(title):
    print(f"Searching: {title}")

    data = tmdb_get(
        "/search/movie",
        {
            "query": title,
            "include_adult": "false",
            "language": "en-US",
        },
    )

    if not data:
        return None

    results = data.get("results", [])

    if not results:
        print(f"WARNING: No TMDB result found for {title}")
        return None

    # Prefer exact title/original-title matches.
    title_lower = title.lower()

    exact_matches = []

    for result in results:
        tmdb_title = result.get("title", "").lower()
        original_title = result.get("original_title", "").lower()

        if title_lower in (tmdb_title, original_title):
            exact_matches.append(result)

    if exact_matches:
        # Prefer the most popular exact result.
        exact_matches.sort(
            key=lambda x: x.get("popularity", 0),
            reverse=True,
        )
        return exact_matches[0]

    # Otherwise use TMDB's first result.
    return results[0]


def get_movie_details(movie_id):
    return tmdb_get(
        f"/movie/{movie_id}",
        {
            "language": "en-US",
            "append_to_response": "credits,alternative_titles",
        },
    )


# ============================================================
# Cast processing
# ============================================================

def get_female_cast(credits):
    """
    TMDB gender:
    0 = Not specified
    1 = Female
    2 = Male
    3 = Non-binary

    For the current site requirement we include cast members
    that TMDB explicitly marks as female.
    """

    cast = credits.get("cast", [])

    female_cast = []

    for person in cast:
        if person.get("gender") != 1:
            continue

        profile_path = person.get("profile_path")

        female_cast.append(
            {
                "id": person.get("id"),
                "name": person.get("name"),
                "character": person.get("character") or "",
                "order": person.get("order"),
                "profile": (
                    f"{IMAGE_BASE_URL}{profile_path}"
                    if profile_path
                    else None
                ),
            }
        )

    female_cast.sort(
        key=lambda person: (
            person.get("order")
            if person.get("order") is not None
            else 9999
        )
    )

    return female_cast


# ============================================================
# Movie processing
# ============================================================

def build_movie_record(search_title):
    search_result = search_movie(search_title)

    if not search_result:
        return {
            "search_title": search_title,
            "found": False,
        }

    movie_id = search_result["id"]

    details = get_movie_details(movie_id)

    if not details:
        return {
            "search_title": search_title,
            "tmdb_id": movie_id,
            "found": False,
        }

    release_date = details.get("release_date") or ""

    year = None

    if len(release_date) >= 4:
        try:
            year = int(release_date[:4])
        except ValueError:
            year = None

    poster_path = details.get("poster_path")

    genres = [
        genre.get("name")
        for genre in details.get("genres", [])
        if genre.get("name")
    ]

    production_countries = [
        {
            "iso_3166_1": country.get("iso_3166_1"),
            "name": country.get("name"),
        }
        for country in details.get("production_countries", [])
    ]

    spoken_languages = [
        {
            "iso_639_1": language.get("iso_639_1"),
            "english_name": language.get("english_name"),
            "name": language.get("name"),
        }
        for language in details.get("spoken_languages", [])
    ]

    alternative_titles = []

    alternative_title_data = details.get(
        "alternative_titles",
        {}
    )

    for item in alternative_title_data.get("titles", []):
        title = item.get("title")

        if title:
            alternative_titles.append(
                {
                    "country": item.get("iso_3166_1"),
                    "title": title,
                    "type": item.get("type") or "",
                }
            )

    credits = details.get("credits", {})

    female_cast = get_female_cast(credits)

    record = {
        "found": True,

        # Identification
        "tmdb_id": details.get("id"),
        "search_title": search_title,
        "title": details.get("title"),
        "original_title": details.get("original_title"),

        # Basic information
        "year": year,
        "release_date": release_date,
        "runtime": details.get("runtime"),
        "status": details.get("status"),

        # Detail-page information
        "genres": genres,
        "overview_en": details.get("overview") or "",

        # Chinese translation will be stored separately.
        # TMDB itself is not used as an automatic EN -> ZH translator.
        "overview_zh": "",

        # Poster
        "poster_path": poster_path,
        "poster": (
            f"{IMAGE_BASE_URL}{poster_path}"
            if poster_path
            else None
        ),

        # Language / country
        "original_language": details.get("original_language"),
        "production_countries": production_countries,
        "spoken_languages": spoken_languages,

        # Alternative titles
        "alternative_titles": alternative_titles,

        # Cast
        "cast": female_cast,

        # Additional TMDB information
        "homepage": details.get("homepage") or "",
        "tagline": details.get("tagline") or "",
        "imdb_id": details.get("imdb_id"),
        "popularity": details.get("popularity"),
        "vote_average": details.get("vote_average"),
        "vote_count": details.get("vote_count"),
    }

    return record


# ============================================================
# Main
# ============================================================

def main():
    print("=" * 60)
    print("WLW Film Archive — TMDB data updater")
    print("=" * 60)

    movie_data = {}

    successful = 0
    failed = 0

    for index, title in enumerate(MOVIES, start=1):
        print()
        print(f"[{index}/{len(MOVIES)}] {title}")

        try:
            record = build_movie_record(title)

            movie_data[title] = record

            if record.get("found"):
                successful += 1

                print(
                    f"Found: {record.get('title')} "
                    f"({record.get('year')}) "
                    f"[TMDB {record.get('tmdb_id')}]"
                )
            else:
                failed += 1
                print(f"WARNING: Could not retrieve {title}")

        except Exception as error:
            failed += 1

            print(
                f"ERROR while processing {title}: "
                f"{type(error).__name__}: {error}"
            )

            movie_data[title] = {
                "search_title": title,
                "found": False,
                "error": str(error),
            }

        # Be polite to the API.
        time.sleep(0.15)

    output = {
        "source": "TMDB",
        "image_base_url": IMAGE_BASE_URL,
        "movies": movie_data,
    }

    with OUTPUT_FILE.open(
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            output,
            file,
            ensure_ascii=False,
            indent=2,
        )

    print()
    print("=" * 60)
    print(f"Saved: {OUTPUT_FILE}")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    print("=" * 60)


if __name__ == "__main__":
    main()
