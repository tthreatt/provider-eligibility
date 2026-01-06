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
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/identity/auth",
                    headers=self.auth_headers,
                    json={"apikey": self.api_key},
                )

                # Check for HTTP errors
                if response.status_code != 200:
                    error_text = response.text
                    try:
                        error_data = response.json()
                        error_message = error_data.get(
                            "message", error_data.get("error", error_text)
                        )
                    except Exception:
                        error_message = error_text or f"HTTP {response.status_code}"

                    raise Exception(
                        f"ProviderTrust authentication failed: {error_message} (Status: {response.status_code})"
                    )

                data = response.json()
                self._token = data.get("token")
                if not self._token:
                    raise Exception(
                        "ProviderTrust authentication failed: No token received"
                    )
                return data
        except httpx.TimeoutException as e:
            raise Exception(f"ProviderTrust authentication timed out: {str(e)}") from e
        except httpx.RequestError as e:
            raise Exception(
                f"Failed to connect to ProviderTrust API for authentication: {str(e)}"
            ) from e

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

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}{settings.ENDPOINT_URL}",
                    headers=self._get_api_headers(),
                    json={"npis": [npi]},
                )

                # Check for HTTP errors
                if response.status_code != 200:
                    error_text = response.text
                    try:
                        error_data = response.json()
                        error_message = error_data.get(
                            "message", error_data.get("error", error_text)
                        )
                    except Exception:
                        error_message = error_text or f"HTTP {response.status_code}"

                    # Return error structure that the calling code can handle
                    return {
                        "error": True,
                        "status": response.status_code,
                        "message": f"ProviderTrust API error: {error_message}",
                        "details": error_text,
                    }

                try:
                    return response.json()
                except Exception as e:
                    return {
                        "error": True,
                        "status": 500,
                        "message": f"Failed to parse ProviderTrust API response: {str(e)}",
                        "details": response.text[:500],  # First 500 chars of response
                    }
        except httpx.TimeoutException as e:
            return {
                "error": True,
                "status": 504,
                "message": "ProviderTrust API request timed out",
                "details": str(e),
            }
        except httpx.RequestError as e:
            return {
                "error": True,
                "status": 502,
                "message": f"Failed to connect to ProviderTrust API: {str(e)}",
                "details": str(e),
            }
