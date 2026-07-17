import unittest

from app.errors import ApiError
from app.payments import calculate_payment_quote


LISTING = {
    "id": 101,
    "monthlyPrice": 1_000_000,
    "paymentTerms": {
        "dpPercentage": 30,
        "serviceFee": 15_000,
        "adminFee": 25_000,
        "deposit": 200_000,
        "discountPercentage": 10,
    },
}


class PaymentTests(unittest.TestCase):
    def test_full_quote_matches_line_items(self):
        quote = calculate_payment_quote(LISTING, 3, "full")
        self.assertEqual(quote["total"], sum(item["amount"] for item in quote["lineItems"]))
        self.assertEqual(quote["total"], 2_940_000)

    def test_dp_applies_proportional_discount(self):
        quote = calculate_payment_quote(LISTING, 3, "dp")
        self.assertEqual(quote["total"], 1_050_000)

    def test_invalid_duration_is_rejected(self):
        with self.assertRaises(ApiError):
            calculate_payment_quote(LISTING, 0, "full")


if __name__ == "__main__":
    unittest.main()
