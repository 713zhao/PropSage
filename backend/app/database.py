import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from typing import Generator

_raw_url = os.getenv("DATABASE_URL", "sqlite:///./propsage.db")
# main.py stores DATABASE_URL as a plain file path for sqlite3; SQLAlchemy needs the sqlite:/// scheme
DATABASE_URL = _raw_url if "://" in _raw_url else f"sqlite:///{_raw_url}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    _register_models()
    Base.metadata.create_all(bind=engine)


def _register_models() -> None:
    from app.models import transaction, market_data, enbloc  # noqa: F401


# Register models immediately so Base.metadata is populated on import
_register_models()
