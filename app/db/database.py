"""
Conexión a SQLite y sesión de SQLAlchemy.
Base se define aquí; los modelos se importan solo en init_db() para evitar import circular.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependencia FastAPI: proporciona una sesión y la cierra al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Crea todas las tablas en la base de datos (persistencia)."""
    from app.db import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
