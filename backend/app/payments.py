from .errors import validation_error


def calculate_payment_quote(listing: dict, rental_months: int, payment_method: str) -> dict:
    if not isinstance(rental_months, int) or isinstance(rental_months, bool) or rental_months <= 0:
        raise validation_error(
            "Durasi sewa belum valid.",
            {"rentalMonths": "Durasi sewa harus berupa angka bulan lebih dari 0."},
        )

    method = "dp" if payment_method == "dp" else "full"
    terms = listing["paymentTerms"]
    subtotal = listing["monthlyPrice"] * rental_months
    discount = max(0, round(subtotal * terms["discountPercentage"] / 100))
    base_before_discount = (
        max(0, round(subtotal * terms["dpPercentage"] / 100))
        if method == "dp"
        else subtotal
    )
    applied_discount = (
        max(0, round(discount * terms["dpPercentage"] / 100))
        if method == "dp"
        else discount
    )
    total = max(
        0,
        round(
            base_before_discount
            - applied_discount
            + terms["adminFee"]
            + terms["deposit"]
            + terms["serviceFee"]
        ),
    )
    line_items = [
        {"label": "Uang muka (DP)" if method == "dp" else "Pembayaran penuh", "amount": base_before_discount},
        {"label": "Biaya admin", "amount": terms["adminFee"]},
        {"label": "Deposit", "amount": terms["deposit"]},
        {"label": "Biaya layanan Papikos", "amount": terms["serviceFee"]},
        {"label": f"Diskon {terms['discountPercentage']}%", "amount": -applied_discount},
    ]

    return {
        "kosId": listing["id"],
        "rentalMonths": rental_months,
        "paymentMethod": method,
        "lineItems": [item for item in line_items if item["amount"] != 0],
        "total": total,
    }
