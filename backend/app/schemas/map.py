from pydantic import BaseModel


class DistrictData(BaseModel):
    code: str
    name: str
    psf_median: float
    lat: float
    lng: float
    transaction_count: int


class AmenityPoint(BaseModel):
    name: str
    lat: float
    lng: float
    type: str
    subtype: str = ""
