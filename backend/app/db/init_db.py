from sqlalchemy.orm import Session
from app.models.eligibility_rules import (
    BaseRequirement,
    ValidationRule,
    ProviderType,
    ProviderRequirement,
    INITIAL_PROVIDER_TYPES,
    DEFAULT_VALIDATION_RULES
)
import json

def seed_validation_rules(db: Session):
    # Convert DEFAULT_VALIDATION_RULES to the format needed for database
    validation_rules_data = [
        {
            "rule_type": key,
            "rules": rules
        }
        for key, rules in DEFAULT_VALIDATION_RULES.items()
    ]
    
    # Add any additional validation rules needed
    validation_rules_data.extend([
        {
            "rule_type": "cpr_certification",
            "rules": {
                "must_be_current": True,
                "expiration_window_months": 24
            }
        }
    ])

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

        # Use provider types from our models
        provider_types_data = INITIAL_PROVIDER_TYPES

        # Standard requirements template
        standard_requirements = {
            "stateLicense": {
                "requirement_type": "license",
                "name": "State License",
                "description": "Current, unrestricted state license",
                "validation_rule_id": validation_rules["state_license"],
                "is_required": True
            },
            "deaCds": {
                "requirement_type": "registration",
                "name": "DEA Registration",
                "description": "DEA registration for controlled substances",
                "validation_rule_id": validation_rules["dea_registration"],
                "is_required": True
            },
            "boardCertification": {
                "requirement_type": "certification",
                "name": "Board Certification",
                "description": "Board certification in specialty",
                "validation_rule_id": validation_rules["board_certification"],
                "is_required": True
            },
            "degree": {
                "requirement_type": "degree",
                "name": "Professional Degree",
                "description": "Degree from accredited institution",
                "validation_rule_id": validation_rules["degree_validation"],
                "is_required": True
            },
            "medicalDegree": {
                "requirement_type": "medical_degree",
                "name": "Medical Degree",
                "description": "Medical degree from accredited institution",
                "validation_rule_id": validation_rules["degree_validation"],
                "is_required": True
            },
            "residency": {
                "requirement_type": "residency",
                "name": "Residency",
                "description": "Completed residency program",
                "validation_rule_id": validation_rules["residency"],
                "is_required": True
            },
            "malpracticeInsurance": {
                "requirement_type": "insurance",
                "name": "Malpractice Insurance",
                "description": "Current malpractice insurance coverage",
                "validation_rule_id": validation_rules["malpractice_insurance"],
                "is_required": True
            },
            "backgroundCheck": {
                "requirement_type": "background_check",
                "name": "Background Check",
                "description": "Completed background check",
                "validation_rule_id": validation_rules["background_check"],
                "is_required": True
            },
            "workHistory": {
                "requirement_type": "work_history",
                "name": "Work History",
                "description": "Verified work history",
                "validation_rule_id": validation_rules["work_history"],
                "is_required": True
            },
            "continuingEducation": {
                "requirement_type": "continuing_education",
                "name": "Continuing Education",
                "description": "Completed required continuing education credits",
                "validation_rule_id": validation_rules["continuing_education"],
                "is_required": True
            },
            "immunizationRecords": {
                "requirement_type": "immunization",
                "name": "Immunization Records",
                "description": "Up-to-date immunization records",
                "validation_rule_id": validation_rules["immunization_records"],
                "is_required": True
            },
            "professionalReferences": {
                "requirement_type": "references",
                "name": "Professional References",
                "description": "Verified professional references",
                "validation_rule_id": validation_rules["professional_references"],
                "is_required": True
            }
        }

        # Create provider types and their requirements
        for provider_data in provider_types_data:
            # Create provider type
            provider_type = ProviderType(
                code=provider_data["code"],
                name=provider_data["name"]
            )
            db.add(provider_type)
            db.flush()

            # Add requirements based on the provider type's requirements list
            for req_name in provider_data["requirements"]:
                if req_name in standard_requirements:
                    req_data = standard_requirements[req_name]
                    
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