# Create a test script test_db.py in your backend directory
import os

from sqlalchemy import text

from app.core.database import engine


def test_connection():
    """Test database connection"""
    print(f"Attempting to connect to database with URL: {os.getenv('DATABASE_URL')}")
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("Database connection successful!")
        assert result is not None


if __name__ == "__main__":
    test_connection()
