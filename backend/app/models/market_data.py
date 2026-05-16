from sqlalchemy import Column, Integer, String, Text
from app.database import Base


class MarketData(Base):
    __tablename__ = "market_data"

    id = Column(Integer, primary_key=True, index=True)
    dataset = Column(String, index=True)
    period = Column(String, index=True)
    value = Column(Text)
    fetched_at = Column(String)
