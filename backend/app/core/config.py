from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "Provider Eligibility API"
    VERSION: str = "1.0.0"
    BASE_URL: str
    ENDPOINT_URL: str
    API_KEY: str
    
    # Database (you might want to add this if you're using a database)
    DATABASE_URL: str = "sqlite:///./sql_app.db"  # default value
    
    class Config:
        env_file = ".env"
        case_sensitive = True  # Important for exact matching of env variables
        extra = "allow"  # This allows extra fields from .env file

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
