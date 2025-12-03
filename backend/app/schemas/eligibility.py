from typing import Any, Optional

from pydantic import BaseModel, Field


class ValidationRuleSchema(BaseModel):
    must_be_active: Optional[bool] = None
    must_be_unrestricted: Optional[bool] = None
    must_be_accredited: Optional[bool] = None
    license_type: Optional[str] = None
    certification_type: Optional[str] = None
    registration_type: Optional[str] = None
    degree_types: Optional[list[str]] = None
    allowed_levels: Optional[list[str]] = None
    required_for_specialties: Optional[list[str]] = None


class RequirementBase(BaseModel):
    requirement_type: str = Field(default="")
    name: str = Field(default="")
    description: str = Field(default="")
    is_required: bool = True
    validation_rules: dict[str, Any] = Field(default_factory=dict)
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
    validation_rules: Optional[dict[str, Any]] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class ProviderTypeBase(BaseModel):
    code: str
    name: str


class ProviderTypeCreate(ProviderTypeBase):
    requirements: list[RequirementCreate]


class ProviderType(BaseModel):
    id: int
    code: str
    name: str
    requirements: list[RequirementBase]

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
    Licenses: list[dict[str, Any]]


class RawApiResponse(BaseModel):
    rawApiResponse: RawApiResponseInner


class EligibilityResponse(BaseModel):
    isEligible: bool
    requirements: dict[str, Any]
    rawApiResponse: dict[str, Any]
