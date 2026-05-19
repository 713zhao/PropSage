from sqlalchemy import Boolean, Column, Float, Integer, String
from app.database import Base


class EnblocDevelopment(Base):
    __tablename__ = "enbloc_developments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    district = Column(String, index=True)
    age_years = Column(Integer)
    plot_ratio_headroom = Column(Float)
    land_area_sqft = Column(Float)
    previous_csc_attempt = Column(Boolean, default=False)
    ownership_units = Column(Integer)
    lease_remaining_years = Column(Integer)
    csc_status = Column(String, default="None")
    lat = Column(Float)
    lng = Column(Float)
