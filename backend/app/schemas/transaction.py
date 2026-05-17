from pydantic import BaseModel, Field


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
    limit: int = Field(default=50, ge=1, le=500)


class CompsRequest(BaseModel):
    district: str
    area_sqft: float
    tolerance_pct: float = Field(default=0.2, ge=0.0, le=1.0)
