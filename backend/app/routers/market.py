from fastapi import APIRouter
from app.services.data_gov import DataGovService
from app.schemas.market import PPIRecord, RentalRecord, VolumeRecord, VacancyRecord

router = APIRouter(prefix="/api/market", tags=["market"])
_svc = DataGovService()


@router.get("/ppi", response_model=list[PPIRecord])
def get_ppi() -> list[dict]:
    return _svc.get_ppi()


@router.get("/rental", response_model=list[RentalRecord])
def get_rental() -> list[dict]:
    return _svc.get_rental()


@router.get("/volume", response_model=list[VolumeRecord])
def get_volume() -> list[dict]:
    return _svc.get_volume()


@router.get("/vacancy", response_model=list[VacancyRecord])
def get_vacancy() -> list[dict]:
    return _svc.get_vacancy()
