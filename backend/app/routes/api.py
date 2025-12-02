from fastapi import APIRouter

from app.routes.endpoints import provider_trust

api_router = APIRouter(prefix="/api/v1")

# Register the provider_trust router
api_router.include_router(
    provider_trust.router, prefix="/provider-trust", tags=["provider-trust"]
)
