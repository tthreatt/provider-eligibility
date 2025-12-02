from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.provider_trust import ProviderTrustAPI

router = APIRouter()
provider_trust = ProviderTrustAPI()


class NPIRequest(BaseModel):
    npi: str


class NPIsRequest(BaseModel):
    npis: list[str]


@router.post("/auth")
async def authenticate():
    try:
        result = await provider_trust.authenticate()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/search-profile")
async def search_profile(request: NPIRequest):
    try:
        result = await provider_trust.search_profile(request.npi)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
