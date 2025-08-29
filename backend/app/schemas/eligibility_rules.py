from pydantic import BaseModel
from typing import List, Dict, Optional, Union, Literal

# Match frontend's ValidationRules interface
class ValidationRules(BaseModel):
    must_be_valid: Optional[bool] = None
    must_be_active: Optional[bool] = None
    must_be_unrestricted: Optional[bool] = None
    must_be_completed: Optional[bool] = None
    must_be_verified: Optional[bool] = None
    must_be_up_to_date: Optional[bool] = None
    must_be_enrolled: Optional[bool] = None
    must_be_current: Optional[bool] = None
    must_be_primary_specialty: Optional[bool] = None
    must_be_accredited: Optional[bool] = None
    identifier_type: Optional[str] = None
    license_type: Optional[str] = None
    certification_type: Optional[str] = None
    registration_type: Optional[str] = None
    degree_type: Optional[str] = None
    verification_period_years: Optional[int] = None
    minimum_count: Optional[int] = None
    hours_required: Optional[int] = None
    minimum_coverage: Optional[int] = None
    required_vaccines: Optional[List[str]] = None
    expiration_window_months: Optional[int] = None

# Match frontend's BaseRequirement interface
class BaseRequirement(BaseModel):
    id: int
    requirement_type: str
    name: str
    description: str
    validation_rules: ValidationRules

    class Config:
        from_attributes = True

# Match frontend's BackendRequirement interface
class RequirementBase(BaseModel):
    requirement_type: str
    name: str
    description: str
    is_required: bool
    validation_rules: ValidationRules
    base_requirement_id: Optional[int] = None
    provider_type_id: Optional[int] = None
    id: Optional[int] = None

class RequirementCreate(RequirementBase):
    pass

class Requirement(RequirementBase):
    id: int
    provider_type_id: int
    base_requirement_id: int

    class Config:
        from_attributes = True

# Match frontend's BackendProviderType interface
class ProviderTypeBase(BaseModel):
    code: str
    name: str

class ProviderTypeCreate(ProviderTypeBase):
    requirements: List[RequirementBase]

class ProviderType(ProviderTypeBase):
    id: int
    requirements: List[Requirement]

    class Config:
        from_attributes = True

# Add requirement categories matching frontend
REQUIREMENT_CATEGORIES = {
    "identification": ["nationalProviderId"],
    "education": ["medicalDegree", "residency", "continuingEducation"],
    "licensing": ["stateLicense", "boardCertification", "deaRegistration"],
    "verification": ["backgroundCheck", "workHistory", "professionalReferences"],
    "compliance": ["immunizationRecords", "malpracticeInsurance"]
}

# Add requirement type to UI key mapping matching frontend
REQUIREMENT_TYPE_TO_UI_KEY = {
    "identifier": "nationalProviderId",
    "license": "stateLicense",
    "certification": "boardCertification",
    "cpr_certification": "cprCertification",
    "background_check": "backgroundCheck",
    "immunization": "immunizationRecords",
    "professional_references": "professionalReferences",
    "continuing_education": "continuingEducation",
    "insurance": "malpracticeInsurance",
    "registration": "deaRegistration",
    "degree": "medicalDegree",
    "residency": "residency",
    "work_history": "workHistory"
}

# Add base requirement IDs matching frontend
BASE_REQUIREMENT_IDS = {
    "nationalProviderId": 8,
    "stateLicense": 1,
    "boardCertification": 2,
    "backgroundCheck": 3,
    "immunizationRecords": 4,
    "professionalReferences": 5,
    "continuingEducation": 6,
    "malpracticeInsurance": 7,
    "deaRegistration": 9,
    "medicalDegree": 11,
    "residency": 13,
    "workHistory": 14
}

# Add default validation rules matching frontend
DEFAULT_VALIDATION_RULES = {
    "nationalProviderId": {"must_be_verified": True},
    "stateLicense": {
        "must_be_active": True,
        "must_be_unrestricted": True
    },
    "boardCertification": {"must_be_active": True},
    "backgroundCheck": {"must_be_completed": True},
    "immunizationRecords": {"must_be_up_to_date": True},
    "professionalReferences": {"must_be_verified": True},
    "continuingEducation": {"must_be_completed": True},
    "malpracticeInsurance": {"must_be_active": True},
    "deaRegistration": {"must_be_active": True},
    "medicalDegree": {"must_be_verified": True},
    "residency": {"must_be_completed": True},
    "workHistory": {
        "must_be_verified": True,
        "verification_period_years": 5
    }
}