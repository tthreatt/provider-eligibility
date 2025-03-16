from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router
from app.routes.provider import router as provider_router
from app.db.base_class import Base  # Import Base from base_class instead
from app.core.database import engine
from app.db.init_db import seed_provider_types
from app.db.session import SessionLocal
from app.models.eligibility_rules import (
    ProviderType,
    ValidationRule,
    BaseRequirement,
    ProviderRequirement
)
from app.models.provider import Provider

# Create tables before FastAPI app initialization
def init_db():
    Base.metadata.drop_all(bind=engine)  # Clear existing tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_provider_types(db)
    finally:
        db.close()

init_db()  # Initialize database and tables

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    # Update this to include your Vercel frontend URL
    allow_origins=[
        "http://localhost:3000",
        "https://provider-eligibility.vercel.app/"  # Add your Vercel frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def init_data():
    db = SessionLocal()
    try:
        # Check if data already exists
        provider_type_count = db.query(ProviderType).count()
        if provider_type_count == 0:
            seed_provider_types(db)
    finally:
        db.close()

# Your existing endpoints
@app.get("/test")
async def test_endpoint():
    return {"message": "Backend is working!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include API routes
app.include_router(api_router, prefix="/api")
app.include_router(provider_router)

# Remove the uvicorn.run part since Vercel handles this
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)