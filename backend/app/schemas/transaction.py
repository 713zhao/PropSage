from pydantic import BaseModel


class TransactionRecord(BaseModel):
    project: str
    street: str
    district: str
    area_sqft: float
    price: float
    psf: float
    floor_range: str
    tenure: str
    sale_date: str
    property_type: str


class TransactionSearchRequest(BaseModel):
    district: str | None = None
    property_type: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    min_psf: float | None = None
    max_psf: float | None = None
    limit: int = 50


class CompsRequest(BaseModel):
    district: str
    area_sqft: float
    tolerance_pct: float = 0.2
