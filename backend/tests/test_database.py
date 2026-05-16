import pytest
from sqlalchemy.orm import Session
from app.database import get_db, init_db


def test_get_db_yields_session():
    gen = get_db()
    db = next(gen)
    assert isinstance(db, Session)
    try:
        next(gen)
    except StopIteration:
        pass


def test_init_db_creates_tables(tmp_path):
    from sqlalchemy import create_engine, inspect
    from app.database import Base
    engine = create_engine(f"sqlite:///{tmp_path}/test.db")
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert "transactions" in tables
    assert "market_data" in tables
