from typing import List
from pydantic import BaseModel
from sqlalchemy import Boolean, Column, DateTime, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base

class ProviderSearchRequest(BaseModel):
    npis: List[str]

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