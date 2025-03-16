from pydantic import BaseModel
from typing import List, Dict, Optional

class ValidationRule(BaseModel):
    must_be_active: Optional[bool] = None
    must_be_unrestricted: Optional[bool] = None
    must_be_completed: Optional[bool] = None
    must_be_verified: Optional[bool] = None
    degree_types: Optional[List[str]] = None
    must_be_accredited: Optional[bool] = None
    license_type: Optional[str] = None
    certification_type: Optional[str] = None
    registration_type: Optional[str] = None
    insurance_type: Optional[str] = None
    verification_period_years: Optional[int] = None

class RequirementRuleBase(BaseModel):
    requirement_type: str
    name: str
    description: str
    is_required: bool
    validation_rules: Dict

class RequirementRuleCreate(RequirementRuleBase):
    provider_type_id: int

class RequirementRule(RequirementRuleBase):
    id: int
    provider_type_id: int

    class Config:
        from_attributes = True

class ProviderTypeBase(BaseModel):
    code: str
    name: str

class ProviderTypeCreate(ProviderTypeBase):
    requirements: List[RequirementRuleBase]

class ProviderType(ProviderTypeBase):
    id: int
    requirements: List[RequirementRule]

    class Config:
        from_attributes = True 