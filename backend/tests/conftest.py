"""Pytest configuration and fixtures"""

import os

# Set TESTING environment variable before any app imports
os.environ["TESTING"] = "true"
os.environ["PYTEST_CURRENT_TEST"] = "true"

# Set required environment variables for Settings model
os.environ["BASE_URL"] = os.getenv("BASE_URL", "http://localhost:8000")
os.environ["ENDPOINT_URL"] = os.getenv("ENDPOINT_URL", "/profile/search")
os.environ["API_KEY"] = os.getenv("API_KEY", "test-api-key")
