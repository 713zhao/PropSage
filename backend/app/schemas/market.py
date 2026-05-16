from pydantic import BaseModel


class PPIRecord(BaseModel):
    quarter: str
    index: float
    change_pct: float


class RentalRecord(BaseModel):
    quarter: str
    property_type: str
    region: str
    index: float


class VolumeRecord(BaseModel):
    month: str
    new_sale: int
    sub_sale: int
    resale: int


class VacancyRecord(BaseModel):
    quarter: str
    property_type: str
    vacancy_pct: float
