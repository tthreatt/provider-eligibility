import os
import shutil

def create_directory_structure():
    # Define the project structure
    structure = {
        "app": {
            "core": {
                "config.py": """from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "Rules Engine API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str
    NPI_API_KEY: str
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
""",
                "database.py": """from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
""",
                "__init__.py": ""
            },
            "models": {
                "base.py": """from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class BaseModel(Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
""",
                "__init__.py": ""
            },
            "schemas": {
                "__init__.py": ""
            },
            "routes": {
                "api.py": """from fastapi import APIRouter

api_router = APIRouter()
""",
                "endpoints": {
                    "__init__.py": ""
                },
                "__init__.py": ""
            },
            "services": {
                "__init__.py": ""
            },
            "utils": {
                "__init__.py": ""
            },
            "main.py": """from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes.api import api_router
from app.core.database import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
""",
            "__init__.py": ""
        },
        "tests": {
            "__init__.py": ""
        },
        "requirements.txt": """fastapi==0.104.1
uvicorn==0.24.0
python-dotenv==1.0.0
sqlalchemy==2.0.23
pydantic==2.4.2
pydantic-settings==2.0.3
python-jose==3.3.0
requests==2.31.0
psycopg2-binary==2.9.9
alembic==1.12.1
""",
        ".env": """DATABASE_URL=postgresql://user:password@localhost:5432/rules_engine
NPI_API_KEY=your_npi_api_key
"""
    }

    def create_structure(base_path, structure):
        for name, content in structure.items():
            path = os.path.join(base_path, name)
            if isinstance(content, dict):
                os.makedirs(path, exist_ok=True)
                create_structure(path, content)
            else:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)

    # Create backend directory
    backend_dir = "backend"
    if os.path.exists(backend_dir):
        shutil.rmtree(backend_dir)
    
    os.makedirs(backend_dir)
    create_structure(backend_dir, structure)
    print(f"✅ FastAPI project structure created in '{backend_dir}' directory")

if __name__ == "__main__":
    create_directory_structure()