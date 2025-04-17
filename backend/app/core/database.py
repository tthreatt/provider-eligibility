from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
import os

# Determine which database URL to use based on environment
DATABASE_URL = os.getenv("DATABASE_URL", settings.DATABASE_URL)

# Add asyncpg support for PostgreSQL
if DATABASE_URL.startswith("postgresql"):
    # Ensure the URL starts with postgresql:// instead of postgres://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10
    )
else:
    # SQLite for development
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}  # Only needed for SQLite
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
