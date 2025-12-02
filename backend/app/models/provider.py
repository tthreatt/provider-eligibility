from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import JSON, Column, DateTime, Integer, String

from app.db.base_class import Base


class ProviderSearchRequest(BaseModel):
    npis: list[str]


class Provider(Base):
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True, index=True)
    npi = Column(String, unique=True, index=True)
    provider_name = Column(String)
    entity_type = Column(String)
    provider_type = Column(String)
    last_updated = Column(DateTime, default=datetime.utcnow)
    licenses = Column(JSON)  # Store licenses as JSON for flexibility
    eligibility_status = Column(JSON)  # Store eligibility details as JSON
