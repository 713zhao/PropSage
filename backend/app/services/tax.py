_ABSD_RATES: dict[tuple[str, int], float] = {
    ("SC", 1): 0.00,
    ("SC", 2): 0.20,
    ("SC", 3): 0.30,
    ("PR", 1): 0.05,
    ("PR", 2): 0.30,
    ("PR", 3): 0.35,
    ("Foreigner", 1): 0.60,
    ("Foreigner", 2): 0.60,
    ("Foreigner", 3): 0.60,
    ("Entity", 1): 0.65,
    ("Entity", 2): 0.65,
    ("Entity", 3): 0.65,
}

_BSD_BRACKETS = [
    (180_000, 0.01),
    (180_000, 0.02),
    (640_000, 0.03),
]


def calculate_bsd(price: float) -> float:
    """Buyer's Stamp Duty on tiered purchase price brackets."""
    bsd = 0.0
    remaining = price
    for cap, rate in _BSD_BRACKETS:
        chunk = min(remaining, cap)
        bsd += chunk * rate
        remaining -= chunk
        if remaining <= 0:
            break
    if remaining > 0:
        bsd += remaining * 0.04
    return round(bsd, 2)


def calculate_absd(price: float, citizenship: str, existing_property_count: int) -> float:
    """Additional Buyer's Stamp Duty. existing_property_count is count BEFORE this purchase."""
    purchase_number = min(existing_property_count + 1, 3)
    rate = _ABSD_RATES.get((citizenship, purchase_number), 0.65)
    return round(price * rate, 2)


def calculate_ssd(price: float, hold_years: float) -> float:
    """Seller's Stamp Duty if sold within 3 years of purchase."""
    if hold_years <= 1:
        rate = 0.12
    elif hold_years <= 2:
        rate = 0.08
    elif hold_years <= 3:
        rate = 0.04
    else:
        rate = 0.0
    return round(price * rate, 2)


def calculate_upfront_cost(
    price: float,
    citizenship: str,
    property_count: int,
    renovation_budget: float = 0.0,
    agent_rate: float = 0.01,
) -> dict:
    bsd = calculate_bsd(price)
    absd = calculate_absd(price, citizenship, property_count)
    legal_fees = 3_000.0
    agent_commission = round(price * agent_rate, 2)
    valuation_fee = 500.0
    total = price + bsd + absd + legal_fees + agent_commission + valuation_fee + renovation_budget
    return {
        "purchase_price": price,
        "bsd": bsd,
        "absd": absd,
        "legal_fees": legal_fees,
        "agent_commission": agent_commission,
        "valuation_fee": valuation_fee,
        "renovation_budget": renovation_budget,
        "total_cash_outlay": round(total, 2),
    }
