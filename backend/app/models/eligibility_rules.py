from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey, DateTime, Sequence
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import json

class ValidationRule(Base):
    __tablename__ = "validation_rules"

    id = Column(Integer, Sequence('validation_rule_id_seq'), primary_key=True, index=True)
    rule_type = Column(String, unique=True, index=True)
    rules = Column(String)  # Store as JSON string instead of PostgreSQL JSON type

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
    type = Column(String)
    name = Column(String)
    description = Column(String)
    is_required = Column(Boolean, default=True)
    provider_type_id = Column(Integer, ForeignKey("provider_types.id"))
    base_requirement_id = Column(Integer, ForeignKey("base_requirements.id"))
    override_validation_rules = Column(JSON)  # Using PostgreSQL's native JSON type
    
    provider_type = relationship("ProviderType", back_populates="requirements")
    base_requirement = relationship("BaseRequirement", back_populates="provider_requirements")

# Initial data for seeding the database
INITIAL_PROVIDER_TYPES = [
    {
        "code": "allopathic_osteopathic",
        "name": "Allopathic & Osteopathic Physicians",
        "requirements": [
            {
                "requirement_type": "degree",
                "name": "Medical Degree",
                "description": "MD or DO from accredited institution",
                "is_required": True,
                "validation_rules": {
                    "degree_types": ["MD", "DO"],
                    "must_be_accredited": True
                }
            },
            {
                "requirement_type": "license",
                "name": "State Medical License",
                "description": "Current, unrestricted state medical license",
                "is_required": True,
                "validation_rules": {
                    "must_be_active": True,
                    "must_be_unrestricted": True,
                    "license_type": "state_medical"
                }
            },
            {
                "requirement_type": "certification",
                "name": "Board Certification",
                "description": "Board certification for specialists",
                "is_required": True,
                "validation_rules": {
                    "must_be_active": True,
                    "certification_type": "board_certification"
                }
            },
            {
                "requirement_type": "registration",
                "name": "DEA Registration",
                "description": "DEA registration if prescribing controlled substances",
                "is_required": False,
                "validation_rules": {
                    "must_be_active": True,
                    "registration_type": "dea"
                }
            },
            {
                "requirement_type": "residency",
                "name": "Residency Program",
                "description": "Completion of residency program",
                "is_required": True,
                "validation_rules": {
                    "must_be_completed": True
                }
            },
            {
                "requirement_type": "insurance",
                "name": "Malpractice Insurance",
                "description": "Current malpractice insurance coverage",
                "is_required": True,
                "validation_rules": {
                    "must_be_active": True,
                    "insurance_type": "malpractice"
                }
            },
            {
                "requirement_type": "background_check",
                "name": "Background Check",
                "description": "Background check verification",
                "is_required": True,
                "validation_rules": {
                    "must_be_completed": True
                }
            },
            {
                "requirement_type": "work_history",
                "name": "Work History",
                "description": "Verification of work history",
                "is_required": True,
                "validation_rules": {
                    "must_be_verified": True,
                    "verification_period_years": 5
                }
            },
            {
                "requirement_type": "immunization",
                "name": "Immunization",
                "description": "Current immunization status",
                "is_required": True,
                "validation_rules": {
                    "must_be_up_to_date": True
                }
            },
            {
                "requirement_type": "continuing_education",
                "name": "Continuing Education",
                "description": "Completion of continuing education courses",
                "is_required": True,
                "validation_rules": {
                    "must_be_completed": True
                }
            },
            {
                "requirement_type": "professional_references",
                "name": "Professional References",
                "description": "Verification of professional references",
                "is_required": True,
                "validation_rules": {
                    "must_be_verified": True
                }
            },
            {
                "requirement_type": "enrollment",
                "name": "Enrollment",
                "description": "Current enrollment in a professional program",
                "is_required": True,
                "validation_rules": {
                    "must_be_enrolled": True
                }
            },
            {
                "requirement_type": "verification",
                "name": "Verification",
                "description": "Verification of identity and credentials",
                "is_required": True,
                "validation_rules": {
                    "must_be_verified": True
                }
            },
            {
                "requirement_type": "identity",
                "name": "Identity",
                "description": "Verification of identity",
                "is_required": True,
                "validation_rules": {
                    "must_be_verified": True
                }
            },
            {
                "requirement_type": "training",
                "name": "Training",
                "description": "Completion of training program",
                "is_required": True,
                "validation_rules": {
                    "must_be_completed": True
                }
            },
            {
                "requirement_type": "specialty_requirement",
                "name": "Specialty Requirement",
                "description": "Completion of specialty requirement",
                "is_required": True,
                "validation_rules": {
                    "must_be_completed": True
                }
            }
        ]
    }
] 