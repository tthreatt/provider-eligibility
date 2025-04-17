# Create a test script test_db.py in your backend directory
from app.core.database import engine
from sqlalchemy import text
import os

def test_connection():
    try:
        print(f"Attempting to connect to database with URL: {os.getenv('DATABASE_URL')}")
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("Database connection successful!")
            return True
    except Exception as e:
        print(f"Database connection failed: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        return False

if __name__ == "__main__":
    test_connection()