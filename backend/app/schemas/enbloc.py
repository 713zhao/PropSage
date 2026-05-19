from pydantic import BaseModel


class DevelopmentProfile(BaseModel):
    id: int
    name: str
    district: str
    age_years: int
    plot_ratio_headroom: float
    land_area_sqft: float
    previous_csc_attempt: bool
    ownership_units: int
    lease_remaining_years: int
    csc_status: str
    lat: float
    lng: float
    score: int
