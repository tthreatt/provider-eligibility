"""Pytest configuration and fixtures"""

import os

# Set TESTING environment variable before any app imports
os.environ["TESTING"] = "true"
os.environ["PYTEST_CURRENT_TEST"] = "true"

# Set required environment variables for Settings model
os.environ["BASE_URL"] = os.getenv("BASE_URL", "http://localhost:8000")
os.environ["ENDPOINT_URL"] = os.getenv("ENDPOINT_URL", "/profile/search")
os.environ["API_KEY"] = os.getenv("API_KEY", "test-api-key")

# Import after setting environment variables
import pytest
from sqlalchemy import create_engine

# Import all models to ensure they're registered with Base.metadata
from app.models import eligibility_rules, provider  # noqa: F401
from app.core.database import Base


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all database tables before tests run"""
    # Only create tables if we have a test database URL
    db_url = os.getenv("DATABASE_URL", "")
    if "test_db" in db_url:
        engine = create_engine(db_url)
        # Create all tables
        Base.metadata.create_all(bind=engine)
        yield
        # Clean up after all tests
        Base.metadata.drop_all(bind=engine)
    else:
        yield
