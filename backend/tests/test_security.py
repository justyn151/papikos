import unittest

from app.security import hash_password, normalize_phone_number, verify_password


class SecurityTests(unittest.TestCase):
    def test_password_hash_round_trip(self):
        password_hash, salt = hash_password("rahasia-kuat")
        self.assertTrue(verify_password("rahasia-kuat", salt, password_hash))
        self.assertFalse(verify_password("password-salah", salt, password_hash))

    def test_phone_normalization_keeps_node_compatibility(self):
        self.assertEqual(normalize_phone_number("+62 812-3456-7890"), "081234567890")


if __name__ == "__main__":
    unittest.main()
