from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ValidationRuleSchema(BaseModel):
    must_be_active: Optional[bool] = None
    must_be_unrestricted: Optional[bool] = None
    must_be_accredited: Optional[bool] = None
    license_type: Optional[str] = None
    certification_type: Optional[str] = None
    registration_type: Optional[str] = None
    degree_types: Optional[List[str]] = None
    allowed_levels: Optional[List[str]] = None
    required_for_specialties: Optional[List[str]] = None

class RequirementBase(BaseModel):
    requirement_type: str = Field(default="")
    name: str = Field(default="")
    description: str = Field(default="")
    is_required: bool = True
    validation_rules: Dict[str, Any] = Field(default_factory=dict)
    base_requirement_id: Optional[int] = None
    provider_type_id: Optional[int] = None
    id: Optional[int] = None

    class Config:
        from_attributes = True

class RequirementCreate(RequirementBase):
    pass

class Requirement(BaseModel):
    id: int
    requirement_type: str
    name: str
    description: str
    is_required: bool
    base_requirement_id: int
    provider_type_id: int
    validation_rules: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
        populate_by_name = True

class ProviderTypeBase(BaseModel):
    code: str
    name: str

class ProviderTypeCreate(ProviderTypeBase):
    requirements: List[RequirementCreate]

class ProviderType(BaseModel):
    id: int
    code: str
    name: str
    requirements: List[RequirementBase]

    class Config:
        from_attributes = True

class EligibilityCheck(BaseModel):
    npi: str

class EligibilityRequirements(BaseModel):
    stateLicense: bool
    deaCds: bool
    boardCertification: bool
    degree: bool
    residency: bool
    malpracticeInsurance: bool
    backgroundCheck: bool
    workHistory: bool
    providerType: str

class NPIValidation(BaseModel):
    providerName: str
    npi: str
    updateDate: str

class RawApiResponseInner(BaseModel):
    NPI_Validation: NPIValidation
    Licenses: List[Dict[str, Any]]

class RawApiResponse(BaseModel):
    rawApiResponse: RawApiResponseInner

class EligibilityResponse(BaseModel):
    isEligible: bool
    requirements: Dict[str, bool]
    rawApiResponse: Dict[str, Any] 