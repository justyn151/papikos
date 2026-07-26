import unittest

from app.errors import ApiError
from app.services.admin import (
    validate_listing_review,
    validate_publishable_owner,
    validate_verification_status,
)
from app.services.auth import LOGIN_ROLES, REGISTER_ROLES
from app.services.owner import validate_owner_listing, validate_submission_status


VALID_LISTING = {
    "title": "Kos Uji",
    "city": "Bandung",
    "monthly_price": 1_250_000,
    "tag": "putri",
    "address": "Jl. Uji No. 1",
    "description": "Kos untuk menguji alur pemilik.",
    "room_size": "3 x 4 m",
    "available_rooms": 2,
    "image_url": "https://example.com/kos.jpg",
    "image_alt": "Kamar kos uji",
    "latitude": -6.9,
    "longitude": 107.6,
}


class AdminOwnerRulesTests(unittest.TestCase):
    def test_admin_can_login_but_cannot_self_register(self):
        self.assertIn("admin", LOGIN_ROLES)
        self.assertNotIn("admin", REGISTER_ROLES)

    def test_rejected_listing_requires_review_notes(self):
        with self.assertRaises(ApiError):
            validate_listing_review("rejected", "")
        self.assertEqual(
            validate_listing_review("rejected", "  Foto belum jelas.  "),
            ("rejected", "Foto belum jelas."),
        )

    def test_only_owner_accounts_have_verification_workflow(self):
        self.assertEqual(validate_verification_status("pemilik-kos", "verified"), "verified")
        with self.assertRaises(ApiError):
            validate_verification_status("admin", "verified")

    def test_listing_publication_requires_active_verified_owner(self):
        validate_publishable_owner(7, True, "verified")
        with self.assertRaises(ApiError):
            validate_publishable_owner(None, None, None)
        with self.assertRaises(ApiError):
            validate_publishable_owner(7, False, "verified")
        with self.assertRaises(ApiError):
            validate_publishable_owner(7, True, "pending")

    def test_owner_listing_validation_normalizes_core_fields(self):
        result = validate_owner_listing(VALID_LISTING)
        self.assertEqual(result["tag"], "Putri")
        self.assertEqual(result["monthly_price"], 1_250_000)

    def test_owner_listing_requires_complete_coordinates(self):
        values = {**VALID_LISTING, "longitude": None}
        with self.assertRaises(ApiError):
            validate_owner_listing(values)
        with self.assertRaises(ApiError):
            validate_owner_listing({**VALID_LISTING, "latitude": None, "longitude": None})

    def test_only_draft_or_rejected_listing_can_be_submitted(self):
        validate_submission_status("draft")
        validate_submission_status("rejected")
        with self.assertRaises(ApiError):
            validate_submission_status("published")


if __name__ == "__main__":
    unittest.main()
