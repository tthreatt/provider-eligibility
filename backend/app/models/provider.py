from typing import List
from pydantic import BaseModel

class ProviderSearchRequest(BaseModel):
    npis: List[str] 