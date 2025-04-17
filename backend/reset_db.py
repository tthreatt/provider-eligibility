from app.core.database import Base, engine
from sqlalchemy import text
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def reset_database():
    try:
        logger.info("Attempting to connect to database...")
        # Test the connection first
        with engine.connect() as conn:
            logger.info("Successfully connected to database")
            
            # Get current schema
            result = conn.execute(text("SELECT current_schema();"))
            current_schema = result.scalar()
            logger.info(f"Current schema: {current_schema}")
            
            # Get list of tables
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            tables = [row[0] for row in result]
            logger.info(f"Existing tables: {tables}")
            
            # Drop all tables
            logger.info("Dropping schema...")
            conn.execute(text("DROP SCHEMA public CASCADE;"))
            conn.execute(text("CREATE SCHEMA public;"))
            conn.commit()
            
            logger.info("Database has been reset successfully!")
            
    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")
        raise

if __name__ == "__main__":
    reset_database() 