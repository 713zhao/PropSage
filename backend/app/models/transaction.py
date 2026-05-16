from sqlalchemy import Column, Float, Integer, String
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    project = Column(String, index=True)
    street = Column(String)
    district = Column(String, index=True)
    area_sqft = Column(Float)
    price = Column(Float)
    psf = Column(Float)
    floor_range = Column(String)
    tenure = Column(String)
    sale_date = Column(String, index=True)
    property_type = Column(String, index=True)
