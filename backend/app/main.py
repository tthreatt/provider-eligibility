from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes.api import api_router
from app.routes.provider import router as provider_router
from app.core.database import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

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
        "https://your-frontend-url.vercel.app"  # Add your Vercel frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your existing endpoints
@app.get("/test")
async def test_endpoint():
    return {"message": "Backend is working!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include API routes
app.include_router(api_router)
app.include_router(provider_router)

# Remove the uvicorn.run part since Vercel handles this
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)