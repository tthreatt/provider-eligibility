import pytest
from httpx import AsyncClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base URL for the API
BASE_URL = os.getenv("BASE_URL", "https://api.providertrust.com")
ENDPOINT_URL = os.getenv("ENDPOINT_URL", "/profile/search")
SANCTIONS_ENDPOINT_URL = os.getenv("SANCTIONS_ENDPOINT_URL", "/search/instant/npi")
API_KEY = os.getenv("API_KEY")

# Auth headers
auth_headers = {
    "Accept": "application/vnd.providertrust-v1.0+json",
    "Content-Type": "application/vnd.providertrust-apikey-v1.0+json",
    "Authorization": f"ApiKey {API_KEY}"
}

async def get_auth_token(client: AsyncClient) -> str:
    """Get authentication token from Provider Trust API"""
    auth_url = f"{BASE_URL}/identity/auth"  # Updated auth URL
    
    headers = {
        'Content-Type': 'application/vnd.providertrust-apikey-v1.0+json',
        'Accept': 'application/vnd.providertrust-v1.0+json'
    }

    payload = {
        "apikey": API_KEY
    }

    auth_response = await client.post(
        auth_url,
        headers=headers,
        json=payload
    )
    
    print("Auth Response Status:", auth_response.status_code)
    data = auth_response.json()
    print("Auth Response Data:", data)
    token = data.get('token')
    print("Token being used:", token)
    return token

@pytest.mark.asyncio
@pytest.mark.order(1)
async def test_auth():
    async with AsyncClient(base_url=BASE_URL) as client:
        token = await get_auth_token(client)
        assert token is not None, "Failed to get authentication token"

@pytest.mark.asyncio
@pytest.mark.order(2)
async def test_search_profile():
    async with AsyncClient(base_url=BASE_URL) as client:
        # Get auth token first
        token = await get_auth_token(client)
        
        # Set headers with Bearer token
        api_headers = {
            "Accept": "application/vnd.providertrust-v1.0+json",
            "Content-Type": "application/vnd.providertrust-v1.0+json",
            "Authorization": f"Bearer {token}"
        }
        
        # Test data
        test_npi = "1104025329"
        response = await client.post(
            ENDPOINT_URL,
            headers=api_headers,
            json={"npi": test_npi}
        )
        
        assert response.status_code == 200
        data = response.json()
        print("Profile Search Response:", data)

@pytest.mark.asyncio
@pytest.mark.order(3)
async def test_search_sanctions():
    async with AsyncClient(base_url=BASE_URL) as client:
        # Get auth token first
        token = await get_auth_token(client)
        
        # Set headers with Bearer token
        api_headers = {
            "Accept": "application/vnd.providertrust-v1.0+json",
            "Content-Type": "application/vnd.providertrust-v1.0+json",
            "Authorization": f"Bearer {token}"  # Changed to use Bearer token
        }
        
        # Test data
        test_npis = ["1104025329"]
        response = await client.post(
            SANCTIONS_ENDPOINT_URL,
            headers=api_headers,
            json={"npis": test_npis}
        )
        
        assert response.status_code == 200
        data = response.json()
        print("Sanctions Search Response:", data)