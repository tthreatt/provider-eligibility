import httpx

from app.core.config import settings


class ProviderTrustAPI:
    def __init__(self):
        self.base_url = settings.BASE_URL
        self.api_key = settings.API_KEY
        self._token = None

        # Headers for auth endpoint
        self.auth_headers = {
            "Accept": "application/vnd.providertrust-v1.0+json",
            "Content-Type": "application/vnd.providertrust-apikey-v1.0+json",
        }

    async def authenticate(self):
        """Authenticate with the Provider Trust API"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/identity/auth",
                headers=self.auth_headers,
                json={"apikey": self.api_key},
            )
            data = response.json()
            self._token = data.get("token")
            return data

    def _get_api_headers(self):
        """Get headers with current bearer token"""
        if not self._token:
            raise Exception("Not authenticated. Call authenticate() first")

        return {
            "Accept": "application/vnd.providertrust-v1.0+json",
            "Content-Type": "application/vnd.providertrust-v1.0+json",
            "Authorization": f"Bearer {self._token}",
        }

    async def search_profile(self, npi: str):
        """Search profile by NPI"""
        if not self._token:
            await self.authenticate()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}{settings.ENDPOINT_URL}",
                headers=self._get_api_headers(),
                json={"npis": [npi]},
            )
            return response.json()
