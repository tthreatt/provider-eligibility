import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.api import api_router
from app.core.config import settings
from app.core.database import engine
from app.db.init_db import init_db

# Import all models to ensure they are registered with SQLAlchemy
from app.routes.provider import router as provider_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
)


@app.on_event("startup")
async def startup_event():
    """Initialize database tables and seed data on app startup"""
    # Skip initialization in test environment or if pytest is running
    if (
        os.getenv("TESTING") == "true"
        or os.getenv("PYTEST_CURRENT_TEST")
        or "pytest" in os.getenv("_", "").lower()
    ):
        return

    # Only initialize if we have a valid database URL (not test DB)
    db_url = os.getenv("DATABASE_URL", "")
    if "test_db" in db_url or not db_url:
        return

    try:
        db = Session(engine)
        try:
            init_db(db)
        except Exception as e:
            # Log but don't fail - allows app to start even if DB is unavailable
            print(f"Error initializing database: {e}")
        finally:
            db.close()
    except Exception as e:
        # If we can't even create a session, just log and continue
        print(f"Could not initialize database connection: {e}")


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        # Test database connection
        db = Session(engine)
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


# Include API routes
app.include_router(api_router, prefix="/api")
app.include_router(provider_router)

# Remove the uvicorn.run part since Vercel handles this
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
