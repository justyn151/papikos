import unittest

from app.errors import ApiError
from app.filters import parse_optional_integer
from app.search import fuzzy_match_score, normalize_search_text, search_candidates


class SearchTests(unittest.TestCase):
    def test_normalization_handles_indonesian_aliases_and_punctuation(self):
        self.assertEqual(normalize_search_text("  Jogja!!! "), "yogyakarta")
        self.assertEqual(normalize_search_text("Univ. Gajah Mada"), "universitas gadjah mada")

    def test_one_letter_typo_still_matches_location(self):
        self.assertIsNotNone(fuzzy_match_score("Yogyakrta", ["Yogyakarta"]))
        self.assertIsNotNone(fuzzy_match_score("Bandng", ["Bandung"]))

    def test_typo_in_known_acronym_expands_to_campus(self):
        self.assertIn("universitas gadjah mada", search_candidates("ugmm"))
        self.assertIsNotNone(fuzzy_match_score("ugmm", ["Universitas Gadjah Mada"]))

    def test_unrelated_search_is_not_accepted(self):
        self.assertIsNone(fuzzy_match_score("Makassar", ["Yogyakarta", "Bandung"]))

    def test_blank_optional_price_is_accepted(self):
        self.assertIsNone(parse_optional_integer("", "minPrice"))
        self.assertIsNone(parse_optional_integer(None, "maxPrice"))

    def test_optional_price_is_parsed(self):
        self.assertEqual(parse_optional_integer(" 1500000 ", "minPrice"), 1_500_000)

    def test_invalid_optional_price_is_rejected(self):
        with self.assertRaises(ApiError):
            parse_optional_integer("satu juta", "minPrice")


if __name__ == "__main__":
    unittest.main()
