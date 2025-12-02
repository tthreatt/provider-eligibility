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

# Initialize database tables and seed data
db = Session(engine)
try:
    init_db(db)
except Exception as e:
    print(f"Error initializing database: {e}")
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
)

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
