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

_VALID_CITIZENSHIPS = {"SC", "PR", "Foreigner", "Entity"}

_BSD_BRACKETS = [
    (180_000, 0.01),
    (180_000, 0.02),
    (640_000, 0.03),
]


def calculate_bsd(price: float) -> float:
    """Buyer's Stamp Duty on tiered purchase price brackets."""
    if price < 0:
        raise ValueError(f"price must be non-negative, got {price!r}.")
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
    if price < 0:
        raise ValueError(f"price must be non-negative, got {price!r}.")
    if existing_property_count < 0:
        raise ValueError(
            f"existing_property_count must be non-negative, got {existing_property_count!r}."
        )
    if citizenship not in _VALID_CITIZENSHIPS:
        raise ValueError(
            f"Unknown citizenship: {citizenship!r}. Expected one of SC, PR, Foreigner, Entity."
        )
    purchase_number = min(existing_property_count + 1, 3)
    rate = _ABSD_RATES[(citizenship, purchase_number)]
    return round(price * rate, 2)


def calculate_ssd(price: float, hold_years: float) -> float:
    """Seller's Stamp Duty if sold within 3 years of purchase."""
    if price < 0:
        raise ValueError(f"price must be non-negative, got {price!r}.")
    if hold_years < 0:
        raise ValueError(f"hold_years must be non-negative, got {hold_years!r}.")
    if hold_years <= 1:
        rate = 0.12
    elif hold_years <= 2:
        rate = 0.08
    elif hold_years <= 3:
        # Per IRAS SSD table, exactly 3 years is still within the SSD window (4% applies).
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
    if price < 0:
        raise ValueError(f"price must be non-negative, got {price!r}.")
    if property_count < 0:
        raise ValueError(f"property_count must be non-negative, got {property_count!r}.")
    if renovation_budget < 0:
        raise ValueError(f"renovation_budget must be non-negative, got {renovation_budget!r}.")
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
