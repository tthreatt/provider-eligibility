from app.main import app
from app.core.database import Base, engine, get_db
from app.db.init_db import init_db
from sqlalchemy.orm import Session
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database on cold start
try:
    logger.info("Initializing database...")
    db = Session(engine)
    init_db(db)
    db.close()
    logger.info("Database initialization complete")
except Exception as e:
    logger.error(f"Error initializing database: {str(e)}")
    # Don't raise the error, as we want the app to start even if DB init fails
    # The health check endpoint will reveal DB issues

# This is for Vercel
app = app