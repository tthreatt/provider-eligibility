from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey, DateTime, Sequence
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import json

class ValidationRule(Base):
    __tablename__ = "validation_rules"

    id = Column(Integer, Sequence('validation_rule_id_seq'), primary_key=True, index=True)
    rule_type = Column(String, unique=True, index=True)
    rules = Column(String)  # Store as JSON string for better compatibility

    def set_rules(self, rules_dict):
        self.rules = json.dumps(rules_dict)

    def get_rules(self):
        return json.loads(self.rules) if self.rules else {}

class BaseRequirement(Base):
    __tablename__ = "base_requirements"

    id = Column(Integer, Sequence('base_requirement_id_seq'), primary_key=True, index=True)
    requirement_type = Column(String, index=True)
    name = Column(String)
    description = Column(String)
    validation_rule_id = Column(Integer, ForeignKey("validation_rules.id"))

    validation_rule = relationship("ValidationRule")
    provider_requirements = relationship("ProviderRequirement", back_populates="base_requirement")

class ProviderType(Base):
    __tablename__ = "provider_types"

    id = Column(Integer, Sequence('provider_type_id_seq'), primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String)

    requirements = relationship("ProviderRequirement", back_populates="provider_type")

class ProviderRequirement(Base):
    __tablename__ = "provider_requirements"

    id = Column(Integer, Sequence('provider_requirement_id_seq'), primary_key=True, index=True)
    is_required = Column(Boolean, default=True)
    provider_type_id = Column(Integer, ForeignKey("provider_types.id"))
    base_requirement_id = Column(Integer, ForeignKey("base_requirements.id"))
    override_validation_rules = Column(String)  # Changed to String to match ValidationRule
    
    provider_type = relationship("ProviderType", back_populates="requirements")
    base_requirement = relationship("BaseRequirement", back_populates="provider_requirements")

    def set_validation_rules(self, rules_dict):
        self.override_validation_rules = json.dumps(rules_dict) if rules_dict else None

    def get_validation_rules(self):
        return json.loads(self.override_validation_rules) if self.override_validation_rules else None

# Initial provider types matching frontend configuration
INITIAL_PROVIDER_TYPES = [
    {
        "code": "MD",
        "name": "Allopathic & Osteopathic Physicians",
        "requirements": ["stateLicense", "deaCds", "boardCertification", "degree", "residency", "malpracticeInsurance", "backgroundCheck", "workHistory"]
    },
    {
        "code": "BH",
        "name": "Behavioral Health & Social Service Providers",
        "requirements": ["stateLicense", "degree", "malpracticeInsurance", "backgroundCheck", "workHistory"]
    },
    {
        "code": "DC",
        "name": "Chiropractic Providers",
        "requirements": ["stateLicense", "degree", "malpracticeInsurance", "backgroundCheck", "workHistory"]
    },
    {
        "code": "DDS",
        "name": "Dental Providers",
        "requirements": ["stateLicense", "deaCds", "degree", "malpracticeInsurance", "backgroundCheck", "workHistory"]
    },
    {
        "code": "DN",
        "name": "Dietary & Nutritional Service Providers",
        "requirements": ["stateLicense", "degree", "malpracticeInsurance", "backgroundCheck", "workHistory"]
    },
    {
        "code": "EMS",
        "name": "Emergency Medical Service Providers",
        "requirements": ["stateLicense", "degree", "malpracticeInsurance", "backgroundCheck", "workHistory"]
    },
    {
        "code": "OD",
        "name": "Eye and Vision Services Providers",
        "requirements": ["stateLicense", "deaCds", "boardCertification", "degree", "malpracticeInsurance", "backgroundCheck", "workHistory"]
    },
    {
        "code": "RN",
        "name": "Nursing Service Providers",
        "requirements": ["stateLicense", "degree", "malpracticeInsurance", "backgroundCheck", "workHistory"]
    },
    {
        "code": "RPH",
        "name": "Pharmacy Service Providers",
        "requirements": ["stateLicense", "deaCds", "boardCertification", "degree", "malpracticeInsurance", "backgroundCheck", "workHistory"]
    },
    {
        "code": "PA",
        "name": "Physician Assistants & Advanced Practice Nursing Providers",
        "requirements": ["stateLicense", "deaCds", "boardCertification", "degree", "malpracticeInsurance", "backgroundCheck", "workHistory"]
    },
    {
        "code": "DPM",
        "name": "Podiatric Medicine & Surgery Service Providers",
        "requirements": ["stateLicense", "deaCds", "boardCertification", "degree", "malpracticeInsurance", "backgroundCheck", "workHistory"]
    },
    {
        "code": "SLP",
        "name": "Speech, Language and Hearing Service Providers",
        "requirements": ["stateLicense", "degree", "malpracticeInsurance", "backgroundCheck", "workHistory"]
    }
]

# Default validation rules matching frontend
DEFAULT_VALIDATION_RULES = {
    "national_provider_id": {"must_be_verified": True},
    "state_license": {
        "must_be_active": True,
        "must_be_unrestricted": True
    },
    "board_certification": {"must_be_active": True},
    "background_check": {"must_be_completed": True},
    "immunization_records": {"must_be_up_to_date": True},
    "professional_references": {"must_be_verified": True},
    "continuing_education": {"must_be_completed": True},
    "malpractice_insurance": {"must_be_active": True},
    "dea_registration": {"must_be_active": True},
    "degree_validation": {"must_be_verified": True},
    "residency": {"must_be_completed": True},
    "work_history": {
        "must_be_verified": True,
        "verification_period_years": 5
    }
}