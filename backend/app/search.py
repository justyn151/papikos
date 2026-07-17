import math
import re
import unicodedata
from difflib import SequenceMatcher


WORD_REPLACEMENTS = {
    "univ": "universitas",
    "university": "universitas",
    "universities": "universitas",
    "universiti": "universitas",
    "universite": "universitas",
    "jogyakarta": "yogyakarta",
    "jogjakarta": "yogyakarta",
    "jogja": "yogyakarta",
    "yogya": "yogyakarta",
    "djogja": "yogyakarta",
    "gajah": "gadjah",
    "gadja": "gadjah",
}

QUERY_ALIASES = {
    "dki jakarta": ["jakarta"],
    "daerah khusus ibukota jakarta": ["jakarta"],
    "di yogyakarta": ["yogyakarta"],
    "daerah istimewa yogyakarta": ["yogyakarta"],
    "jawa barat": ["bandung", "depok", "bogor", "jatinangor"],
    "jabar": ["bandung", "depok", "bogor", "jatinangor"],
    "jawa tengah": ["semarang", "surakarta", "solo", "purwokerto"],
    "jateng": ["semarang", "surakarta", "solo", "purwokerto"],
    "jawa timur": ["surabaya", "malang"],
    "jatim": ["surabaya", "malang"],
    "ugm": ["universitas gadjah mada"],
    "uny": ["universitas negeri yogyakarta"],
    "umy": ["universitas muhammadiyah yogyakarta"],
    "uii": ["universitas islam indonesia"],
    "ui": ["universitas indonesia"],
    "itb": ["institut teknologi bandung"],
    "unpad": ["universitas padjadjaran"],
    "unair": ["universitas airlangga"],
    "ub": ["universitas brawijaya"],
    "its": ["institut teknologi sepuluh nopember"],
    "ipb": ["ipb university"],
    "binus": ["binus university kemanggisan"],
}


def normalize_search_text(value: object) -> str:
    decomposed = unicodedata.normalize("NFD", str(value or "").lower())
    without_marks = "".join(char for char in decomposed if unicodedata.category(char) != "Mn")
    words = re.sub(r"[^a-z0-9]+", " ", without_marks).strip().split()
    return " ".join(WORD_REPLACEMENTS.get(word, word) for word in words)


def search_candidates(value: object) -> list[str]:
    normalized = normalize_search_text(value)
    if not normalized:
        return []
    aliases = list(QUERY_ALIASES.get(normalized, []))
    if not aliases:
        for alias, replacements in QUERY_ALIASES.items():
            length_difference = abs(len(alias) - len(normalized))
            if length_difference <= (1 if len(normalized) <= 5 else 2) and SequenceMatcher(None, normalized, alias).ratio() >= 0.76:
                aliases.extend(replacements)
    return list(dict.fromkeys([normalized, *map(normalize_search_text, aliases)]))


def _word_matches(query_word: str, candidate_word: str) -> bool:
    if query_word in candidate_word or candidate_word.startswith(query_word):
        return True
    minimum_ratio = 0.76 if len(query_word) <= 5 else 0.7
    return SequenceMatcher(None, query_word, candidate_word).ratio() >= minimum_ratio


def fuzzy_match_score(query: object, searchable_values: list[object]) -> float | None:
    candidates = search_candidates(query)
    if not candidates:
        return 0.0
    values = [normalize_search_text(value) for value in searchable_values if normalize_search_text(value)]
    best_score: float | None = None

    for query_value in candidates:
        query_words = query_value.split()
        for value in values:
            if query_value == value:
                score = 0.0
            elif query_value in value:
                score = 1.0
            else:
                value_words = value.split()
                if not all(any(_word_matches(word, value_word) for value_word in value_words) for word in query_words):
                    continue
                score = 2.0 + (1.0 - SequenceMatcher(None, query_value, value).ratio())
            best_score = score if best_score is None else min(best_score, score)

    return best_score


def distance_in_kilometers(first: tuple[float, float], second: tuple[float, float]) -> float:
    earth_radius = 6371
    latitude_distance = math.radians(second[0] - first[0])
    longitude_distance = math.radians(second[1] - first[1])
    first_latitude = math.radians(first[0])
    second_latitude = math.radians(second[0])
    haversine = (
        math.sin(latitude_distance / 2) ** 2
        + math.cos(first_latitude)
        * math.cos(second_latitude)
        * math.sin(longitude_distance / 2) ** 2
    )
    return earth_radius * 2 * math.atan2(math.sqrt(haversine), math.sqrt(1 - haversine))
