"""Pytest configuration and fixtures"""

import os

# Set TESTING environment variable before any app imports
os.environ["TESTING"] = "true"
os.environ["PYTEST_CURRENT_TEST"] = "true"
