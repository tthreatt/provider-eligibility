from sqlalchemy.orm import Session
from app.models.eligibility_rules import (
    BaseRequirement,
    ValidationRule,
    ProviderType,
    ProviderRequirement
)
import json

def seed_validation_rules(db: Session):
    validation_rules_data = [
        {
            "rule_type": "state_license",
            "rules": {
                "must_be_active": True,
                "must_be_unrestricted": True
            }
        },
        {
            "rule_type": "cpr_certification",
            "rules": {
                "must_be_current": True,
                "expiration_window_months": 24
            }
        },
        {
            "rule_type": "background_check",
            "rules": {
                "must_be_completed": True,
                "expiration_window_months": 12
            }
        },
        {
            "rule_type": "immunization",
            "rules": {
                "must_be_current": True,
                "required_vaccines": ["COVID-19", "Flu", "MMR", "Tdap"]
            }
        },
        {
            "rule_type": "professional_references",
            "rules": {
                "minimum_count": 3,
                "must_be_verified": True
            }
        },
        {
            "rule_type": "continuing_education",
            "rules": {
                "must_be_completed": True,
                "hours_required": 20
            }
        },
        {
            "rule_type": "malpractice_insurance",
            "rules": {
                "must_be_active": True,
                "minimum_coverage": 1000000
            }
        },
        {
            "rule_type": "npi",
            "rules": {
                "must_be_valid": True,
                "must_be_active": True
            }
        },
        {
            "rule_type": "dea_registration",
            "rules": {
                "must_be_active": True,
                "must_be_unrestricted": True
            }
        },
        {
            "rule_type": "board_certification",
            "rules": {
                "must_be_current": True,
                "must_be_primary_specialty": True
            }
        },
        {
            "rule_type": "degree_validation",
            "rules": {
                "must_be_verified": True,
                "must_be_accredited": True
            }
        },
        {
            "rule_type": "work_history",
            "rules": {
                "must_be_verified": True,
                "verification_period_years": 5
            }
        }
    ]

    validation_rules = {}
    for rule_data in validation_rules_data:
        # Check if rule already exists
        existing_rule = db.query(ValidationRule).filter_by(rule_type=rule_data["rule_type"]).first()
        if existing_rule:
            validation_rules[rule_data["rule_type"]] = existing_rule.id
            continue

        # Convert rules dictionary to JSON string
        rules_json = json.dumps(rule_data["rules"])

        # Create new rule
        rule = ValidationRule(
            rule_type=rule_data["rule_type"],
            rules=rules_json  # Store as JSON string
        )
        db.add(rule)
        db.flush()
        validation_rules[rule_data["rule_type"]] = rule.id

    db.commit()
    return validation_rules

def seed_provider_types(db: Session):
    try:
        # Clear existing data
        db.query(ProviderRequirement).delete()
        db.query(ProviderType).delete()
        db.query(BaseRequirement).delete()
        db.query(ValidationRule).delete()
        db.commit()

        # Seed validation rules first
        validation_rules = seed_validation_rules(db)

        # Define all provider types and their requirements
        provider_types_data = [
            {
                "code": "MD",
                "name": "Allopathic & Osteopathic Physicians",
                "requirements": [
                    {
                        "requirement_type": "degree",
                        "name": "Medical Degree",
                        "description": "MD or DO from accredited institution",
                        "validation_rule_id": validation_rules["degree_validation"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "license",
                        "name": "State Medical License",
                        "description": "Current, unrestricted state medical license",
                        "validation_rule_id": validation_rules["state_license"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "certification",
                        "name": "Board Certification",
                        "description": "Board certification for specialists",
                        "validation_rule_id": validation_rules["board_certification"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "registration",
                        "name": "DEA Registration",
                        "description": "DEA registration if prescribing controlled substances",
                        "validation_rule_id": validation_rules["dea_registration"],
                        "is_required": False
                    },
                    {
                        "requirement_type": "insurance",
                        "name": "Malpractice Insurance",
                        "description": "Current malpractice insurance coverage",
                        "validation_rule_id": validation_rules["malpractice_insurance"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "npi",
                        "name": "National Provider Identifier",
                        "description": "Valid NPI number",
                        "validation_rule_id": validation_rules["npi"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "background_check",
                        "name": "Background Check",
                        "description": "Completed background check",
                        "validation_rule_id": validation_rules["background_check"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "work_history",
                        "name": "Work History",
                        "description": "Verified work history",
                        "validation_rule_id": validation_rules["work_history"],
                        "is_required": True
                    }
                ]
            },
            {
                "code": "BH",
                "name": "Behavioral Health & Social Service Providers",
                "requirements": [
                    {
                        "requirement_type": "degree",
                        "name": "Appropriate Degree",
                        "description": "PhD, PsyD, MSW from accredited institution",
                        "validation_rule_id": validation_rules["degree_validation"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "license",
                        "name": "State License",
                        "description": "Current, unrestricted state license",
                        "validation_rule_id": validation_rules["state_license"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "certification",
                        "name": "Board Certification",
                        "description": "Board certification if applicable",
                        "validation_rule_id": validation_rules["board_certification"],
                        "is_required": False
                    },
                    {
                        "requirement_type": "insurance",
                        "name": "Malpractice Insurance",
                        "description": "Current malpractice insurance coverage",
                        "validation_rule_id": validation_rules["malpractice_insurance"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "npi",
                        "name": "National Provider Identifier",
                        "description": "Valid NPI number",
                        "validation_rule_id": validation_rules["npi"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "background_check",
                        "name": "Background Check",
                        "description": "Completed background check",
                        "validation_rule_id": validation_rules["background_check"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "work_history",
                        "name": "Work History",
                        "description": "Verified work history",
                        "validation_rule_id": validation_rules["work_history"],
                        "is_required": True
                    }
                ]
            },
            {
                "code": "DC",
                "name": "Chiropractic Providers",
                "requirements": [
                    {
                        "requirement_type": "degree",
                        "name": "Doctor of Chiropractic",
                        "description": "DC degree from accredited institution",
                        "validation_rule_id": validation_rules["degree_validation"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "license",
                        "name": "State Chiropractic License",
                        "description": "Current, unrestricted state chiropractic license",
                        "validation_rule_id": validation_rules["state_license"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "certification",
                        "name": "NBCE Certification",
                        "description": "National Board of Chiropractic Examiners certification",
                        "validation_rule_id": validation_rules["board_certification"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "insurance",
                        "name": "Malpractice Insurance",
                        "description": "Current malpractice insurance coverage",
                        "validation_rule_id": validation_rules["malpractice_insurance"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "npi",
                        "name": "National Provider Identifier",
                        "description": "Valid NPI number",
                        "validation_rule_id": validation_rules["npi"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "background_check",
                        "name": "Background Check",
                        "description": "Completed background check",
                        "validation_rule_id": validation_rules["background_check"],
                        "is_required": True
                    },
                    {
                        "requirement_type": "work_history",
                        "name": "Work History",
                        "description": "Verified work history",
                        "validation_rule_id": validation_rules["work_history"],
                        "is_required": True
                    }
                ]
            }
        ]

        # Create provider types and their requirements
        for provider_data in provider_types_data:
            # Create provider type
            provider_type = ProviderType(
                code=provider_data["code"],
                name=provider_data["name"]
            )
            db.add(provider_type)
            db.flush()

            # Create requirements for this provider type
            for req_data in provider_data["requirements"]:
                # Create base requirement
                base_req = BaseRequirement(
                    requirement_type=req_data["requirement_type"],
                    name=req_data["name"],
                    description=req_data["description"],
                    validation_rule_id=req_data["validation_rule_id"]
                )
                db.add(base_req)
                db.flush()

                # Create provider requirement
                provider_req = ProviderRequirement(
                    provider_type_id=provider_type.id,
                    base_requirement_id=base_req.id,
                    is_required=req_data["is_required"]
                )
                db.add(provider_req)

        db.commit()

    except Exception as e:
        db.rollback()
        print(f"Error in seed_provider_types: {str(e)}")
        raise

def init_db(db: Session):
    # Create all tables
    from app.core.database import Base
    Base.metadata.create_all(bind=db.get_bind())
    
    # Seed initial data
    seed_validation_rules(db)
    seed_provider_types(db) 