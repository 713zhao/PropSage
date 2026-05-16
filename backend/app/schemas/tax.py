from pydantic import BaseModel


class TaxRequest(BaseModel):
    purchase_price: float
    citizenship: str  # SC | PR | Foreigner | Entity
    existing_property_count: int
    renovation_budget: float = 0.0
    agent_rate: float = 0.01


class TaxResponse(BaseModel):
    purchase_price: float
    bsd: float
    absd: float
    legal_fees: float
    agent_commission: float
    valuation_fee: float
    renovation_budget: float
    total_cash_outlay: float


class SSDRequest(BaseModel):
    purchase_price: float
    hold_years: float


class SSDResponse(BaseModel):
    ssd: float
    ssd_rate: float
    hold_years: float
