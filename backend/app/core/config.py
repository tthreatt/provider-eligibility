import os
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Provider Eligibility API"
    VERSION: str = "1.0.0"
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")
    ENDPOINT_URL: str = os.getenv("ENDPOINT_URL", "/profile/search")
    API_KEY: str = os.getenv("API_KEY", "test-api-key")

    # Database configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://neondb_owner:npg_GBn3ouWv6rjm@ep-tiny-mud-a4ulscia-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require",
    )

    class Config:
        env_file = ".env"
        case_sensitive = True  # Important for exact matching of env variables
        extra = "allow"  # This allows extra fields from .env file


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()
