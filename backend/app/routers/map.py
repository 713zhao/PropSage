from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.map import DistrictData, AmenityPoint
from app.services.map_service import get_districts, get_amenities

router = APIRouter(prefix="/api/map", tags=["map"])


@router.get("/districts", response_model=list[DistrictData])
def districts(db: Session = Depends(get_db)) -> list[DistrictData]:
    return [DistrictData(**d) for d in get_districts(db)]


@router.get("/amenities/{amenity_type}", response_model=list[AmenityPoint])
def amenities(amenity_type: str) -> list[AmenityPoint]:
    return [AmenityPoint(**a) for a in get_amenities(amenity_type)]
