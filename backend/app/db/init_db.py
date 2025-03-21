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
                "minimum_hours": 40
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
    for rule in validation_rules_data:
        # Convert rules dict to JSON string
        rule["rules"] = json.dumps(rule["rules"])
        validation_rule = ValidationRule(**rule)
        db.add(validation_rule)
        db.flush()
        validation_rules[rule["rule_type"]] = validation_rule.id
    
    return validation_rules

def seed_base_requirements(db: Session, validation_rules):
    common_requirements = [
                {
                    "requirement_type": "license",
                    "name": "State License",
            "description": "Current, unrestricted state license",
            "validation_rule_id": validation_rules["state_license"]
                },
                {
                    "requirement_type": "certification",
                    "name": "CPR Certification",
                    "description": "Current CPR certification",
            "validation_rule_id": validation_rules["cpr_certification"]
                },
                {
                    "requirement_type": "background_check",
                    "name": "Background Check",
            "description": "Background check and verification",
            "validation_rule_id": validation_rules["background_check"]
                },
                {
                    "requirement_type": "immunization",
                    "name": "Immunization Records",
                    "description": "Current immunization records",
            "validation_rule_id": validation_rules["immunization"]
                },
                {
                    "requirement_type": "professional_references",
                    "name": "Professional References",
                    "description": "Professional references",
            "validation_rule_id": validation_rules["professional_references"]
                },
                {
                    "requirement_type": "continuing_education",
                    "name": "Continuing Education",
                    "description": "Required continuing education credits",
            "validation_rule_id": validation_rules["continuing_education"]
                },
                {
                    "requirement_type": "insurance",
                    "name": "Malpractice Insurance",
            "description": "Current malpractice insurance coverage",
            "validation_rule_id": validation_rules["malpractice_insurance"]
                },
                {
                    "requirement_type": "identifier",
            "name": "National Provider Identifier",
            "description": "Valid NPI number",
            "validation_rule_id": validation_rules["npi"]
                },
                {
                    "requirement_type": "registration",
                    "name": "DEA Registration",
                    "description": "DEA registration",
            "validation_rule_id": validation_rules["dea_registration"]
                },
                {
                    "requirement_type": "certification",
                    "name": "Board Certification",
            "description": "Board certification",
            "validation_rule_id": validation_rules["board_certification"]
        },
                {
                    "requirement_type": "degree",
            "name": "Medical Degree",
            "description": "Medical degree from accredited institution",
            "validation_rule_id": validation_rules["degree_validation"]
        },
                {
                    "requirement_type": "work_history",
                    "name": "Work History",
                    "description": "Verified work history",
                    "validation_rule_id": validation_rules["work_history"]
                }
    ]
    
    base_requirements = {}
    for req in common_requirements:
        base_req = BaseRequirement(**req)
        db.add(base_req)
        db.flush()
        base_requirements[f"{req['requirement_type']}_{req['name']}"] = base_req.id
    
    return base_requirements

def seed_provider_types(db: Session):
    # Clear existing data
    db.query(ProviderRequirement).delete()
    db.query(ProviderType).delete()
    db.query(BaseRequirement).delete()
    db.query(ValidationRule).delete()
    
    # Seed validation rules first
    validation_rules = seed_validation_rules(db)
    
    # Seed base requirements
    base_requirements = seed_base_requirements(db, validation_rules)
    
    # Define provider types with their requirements
    provider_types_data = [
        {
            "code": "allopathic_osteopathic",
            "name": "Allopathic & Osteopathic Physicians",
            "requirements": [
                {
                    "base_requirement_id": base_requirements["degree_Medical Degree"],
                    "is_required": True,
                    "override_validation_rules": {
                        "degree_types": ["MD", "DO"]
                    }
                },
                {
                    "base_requirement_id": base_requirements["license_State License"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_Board Certification"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["registration_DEA Registration"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["insurance_Malpractice Insurance"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["identifier_National Provider Identifier"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["background_check_Background Check"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["immunization_Immunization Records"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_CPR Certification"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["continuing_education_Continuing Education"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["professional_references_Professional References"],
                    "is_required": True
                }
            ]
        },
        {
            "code": "behavioral_health",
            "name": "Behavioral Health & Social Service Providers",
            "requirements": [
                {
                    "base_requirement_id": base_requirements["degree_Medical Degree"],
                    "is_required": True,
                    "override_validation_rules": {
                        "degree_types": ["PhD", "PsyD", "MSW"]
                    }
                },
                {
                    "base_requirement_id": base_requirements["license_State License"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_Board Certification"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["insurance_Malpractice Insurance"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["identifier_National Provider Identifier"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["background_check_Background Check"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["immunization_Immunization Records"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_CPR Certification"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["continuing_education_Continuing Education"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["professional_references_Professional References"],
                    "is_required": True
                }
            ]
        },
        {
            "code": "chiropractic",
            "name": "Chiropractic Providers",
            "requirements": [
                {
                    "base_requirement_id": base_requirements["degree_Medical Degree"],
                    "is_required": True,
                    "override_validation_rules": {
                        "degree_types": ["DC"]
                    }
                },
                {
                    "base_requirement_id": base_requirements["license_State License"],
                    "is_required": True,
                    "override_validation_rules": {
                        "license_type": "chiropractic"
                    }
                },
                {
                    "base_requirement_id": base_requirements["certification_Board Certification"],
                    "is_required": True,
                    "override_validation_rules": {
                        "certification_type": "nbce"
                    }
                },
                {
                    "base_requirement_id": base_requirements["insurance_Malpractice Insurance"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["identifier_National Provider Identifier"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["background_check_Background Check"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["immunization_Immunization Records"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_CPR Certification"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["continuing_education_Continuing Education"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["professional_references_Professional References"],
                    "is_required": True
                }
            ]
        },
        {
            "code": "dental",
            "name": "Dental Providers",
            "requirements": [
                {
                    "base_requirement_id": base_requirements["degree_Medical Degree"],
                    "is_required": True,
                    "override_validation_rules": {
                        "degree_types": ["DDS", "DMD"]
                    }
                },
                {
                    "base_requirement_id": base_requirements["license_State License"],
                    "is_required": True,
                    "override_validation_rules": {
                        "license_type": "dental"
                    }
                },
                {
                    "base_requirement_id": base_requirements["registration_DEA Registration"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_Board Certification"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["insurance_Malpractice Insurance"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["identifier_National Provider Identifier"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["background_check_Background Check"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["immunization_Immunization Records"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_CPR Certification"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["continuing_education_Continuing Education"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["professional_references_Professional References"],
                    "is_required": True
                }
            ]
        },
        {
            "code": "dietary_nutritional",
            "name": "Dietary & Nutritional Service Providers",
            "requirements": [
                {
                    "base_requirement_id": base_requirements["degree_Medical Degree"],
                    "is_required": True,
                    "override_validation_rules": {
                        "degree_types": ["BS-Nutrition", "MS-Nutrition"]
                    }
                },
                {
                    "base_requirement_id": base_requirements["certification_Board Certification"],
                    "is_required": True,
                    "override_validation_rules": {
                        "certification_type": "rdn"
                    }
                },
                {
                    "base_requirement_id": base_requirements["license_State License"],
                    "is_required": False
                },
                {
                    "base_requirement_id": base_requirements["insurance_Malpractice Insurance"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["identifier_National Provider Identifier"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["background_check_Background Check"],
                    "is_required": True
                }
            ]
        },
        {
            "code": "emergency_medical",
            "name": "Emergency Medical Service Providers",
            "requirements": [
                {
                    "base_requirement_id": base_requirements["certification_Board Certification"],
                    "is_required": True,
                    "override_validation_rules": {
                        "certification_type": "ems",
                        "allowed_levels": ["EMT", "Paramedic"]
                    }
                },
                {
                    "base_requirement_id": base_requirements["license_State License"],
                    "is_required": True,
                    "override_validation_rules": {
                        "license_type": "ems"
                    }
                },
                {
                    "base_requirement_id": base_requirements["background_check_Background Check"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_CPR Certification"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["immunization_Immunization Records"],
                    "is_required": True
                }
            ]
        },
        {
            "code": "eye_vision",
            "name": "Eye and Vision Services Providers",
            "requirements": [
                {
                    "base_requirement_id": base_requirements["degree_Medical Degree"],
                    "is_required": True,
                    "override_validation_rules": {
                        "degree_types": ["OD", "MD"]
                    }
                },
                {
                    "base_requirement_id": base_requirements["license_State License"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_Board Certification"],
                    "is_required": True,
                    "override_validation_rules": {
                        "required_for_specialties": ["ophthalmology"]
                    }
                },
                {
                    "base_requirement_id": base_requirements["registration_DEA Registration"],
                    "is_required": False
                },
                {
                    "base_requirement_id": base_requirements["insurance_Malpractice Insurance"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["identifier_National Provider Identifier"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["background_check_Background Check"],
                    "is_required": True
                }
            ]
        },
        {
            "code": "nursing",
            "name": "Nursing Service Providers",
            "requirements": [
                {
                    "base_requirement_id": base_requirements["degree_Medical Degree"],
                    "is_required": True,
                    "override_validation_rules": {
                        "degree_types": ["BSN", "MSN"]
                    }
                },
                {
                    "base_requirement_id": base_requirements["license_State License"],
                    "is_required": True,
                    "override_validation_rules": {
                        "license_type": "nursing"
                    }
                },
                {
                    "base_requirement_id": base_requirements["certification_Board Certification"],
                    "is_required": False
                },
                {
                    "base_requirement_id": base_requirements["insurance_Malpractice Insurance"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["identifier_National Provider Identifier"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["background_check_Background Check"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_CPR Certification"],
                    "is_required": True
                }
            ]
        },
        {
            "code": "nursing_related",
            "name": "Nursing Service Related Providers",
            "requirements": [
                {
                    "base_requirement_id": base_requirements["certification_Board Certification"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["license_State License"],
                    "is_required": False
                },
                {
                    "base_requirement_id": base_requirements["background_check_Background Check"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_CPR Certification"],
                    "is_required": True
                }
            ]
        },
        {
            "code": "pharmacy",
            "name": "Pharmacy Service Providers",
            "requirements": [
                {
                    "base_requirement_id": base_requirements["degree_Medical Degree"],
                    "is_required": True,
                    "override_validation_rules": {
                        "degree_types": ["PharmD"]
                    }
                },
                {
                    "base_requirement_id": base_requirements["license_State License"],
                    "is_required": True,
                    "override_validation_rules": {
                        "license_type": "pharmacy"
                    }
                },
                {
                    "base_requirement_id": base_requirements["registration_DEA Registration"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_Board Certification"],
                    "is_required": False
                },
                {
                    "base_requirement_id": base_requirements["insurance_Malpractice Insurance"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["identifier_National Provider Identifier"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["background_check_Background Check"],
                    "is_required": True
                }
            ]
        },
        {
            "code": "physician_assistant",
            "name": "Physician Assistants & Advanced Practice Nursing Providers",
            "requirements": [
                {
                    "base_requirement_id": base_requirements["degree_Medical Degree"],
                    "is_required": True,
                    "override_validation_rules": {
                        "degree_types": ["PA", "DNP", "MSN"]
                    }
                },
                {
                    "base_requirement_id": base_requirements["license_State License"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_Board Certification"],
                    "is_required": True,
                    "override_validation_rules": {
                        "certification_type": "specialty_specific"
                    }
                },
                {
                    "base_requirement_id": base_requirements["registration_DEA Registration"],
                    "is_required": False
                },
                {
                    "base_requirement_id": base_requirements["insurance_Malpractice Insurance"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["identifier_National Provider Identifier"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["background_check_Background Check"],
                    "is_required": True
                }
            ]
        },
        {
            "code": "podiatric",
            "name": "Podiatric Medicine & Surgery Service Providers",
            "requirements": [
                {
                    "base_requirement_id": base_requirements["degree_Medical Degree"],
                    "is_required": True,
                    "override_validation_rules": {
                        "degree_types": ["DPM"]
                    }
                },
                {
                    "base_requirement_id": base_requirements["license_State License"],
                    "is_required": True,
                    "override_validation_rules": {
                        "license_type": "podiatry"
                    }
                },
                {
                    "base_requirement_id": base_requirements["certification_Board Certification"],
                    "is_required": False
                },
                {
                    "base_requirement_id": base_requirements["registration_DEA Registration"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["insurance_Malpractice Insurance"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["identifier_National Provider Identifier"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["background_check_Background Check"],
                    "is_required": True
                }
            ]
        },
        {
            "code": "respiratory_rehab",
            "name": "Respiratory, Developmental, Rehabilitative and Restorative Service Providers",
            "requirements": [
                {
                    "base_requirement_id": base_requirements["degree_Medical Degree"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["license_State License"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_Board Certification"],
                    "is_required": False
                },
                {
                    "base_requirement_id": base_requirements["insurance_Malpractice Insurance"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["identifier_National Provider Identifier"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["background_check_Background Check"],
                    "is_required": True
                }
            ]
        },
        {
            "code": "speech_language",
            "name": "Speech, Language and Hearing Service Providers",
            "requirements": [
                {
                    "base_requirement_id": base_requirements["degree_Medical Degree"],
                    "is_required": True,
                    "override_validation_rules": {
                        "degree_types": ["MS-SLP", "AuD"]
                    }
                },
                {
                    "base_requirement_id": base_requirements["license_State License"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_Board Certification"],
                    "is_required": True,
                    "override_validation_rules": {
                        "certification_type": "asha"
                    }
                },
                {
                    "base_requirement_id": base_requirements["insurance_Malpractice Insurance"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["identifier_National Provider Identifier"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["background_check_Background Check"],
                    "is_required": True
                }
            ]
        },
        {
            "code": "student",
            "name": "Student, Health Care",
            "requirements": [
                {
                    "base_requirement_id": base_requirements["degree_Medical Degree"],
                    "is_required": False,
                    "override_validation_rules": {
                        "enrollment_verification_required": True
                    }
                },
                {
                    "base_requirement_id": base_requirements["background_check_Background Check"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["immunization_Immunization Records"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_CPR Certification"],
                    "is_required": True
                }
            ]
        },
        {
            "code": "technician",
            "name": "Technologists, Technicians & Other Technical Service Providers",
            "requirements": [
                {
                    "base_requirement_id": base_requirements["certification_Board Certification"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["license_State License"],
                    "is_required": False
                },
                {
                    "base_requirement_id": base_requirements["background_check_Background Check"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["immunization_Immunization Records"],
                    "is_required": True
                },
                {
                    "base_requirement_id": base_requirements["certification_CPR Certification"],
                    "is_required": True
                }
            ]
        }
    ]
    
    # Process and save provider types
    for provider_type_data in provider_types_data:
        requirements = provider_type_data.pop("requirements")
        provider_type = ProviderType(**provider_type_data)
        db.add(provider_type)
        db.flush()

        for req in requirements:
            if "override_validation_rules" in req:
                req["override_validation_rules"] = json.dumps(req["override_validation_rules"])
            req["provider_type_id"] = provider_type.id
            provider_requirement = ProviderRequirement(**req)
            db.add(provider_requirement)

    db.commit() 

def init_db(db: Session):
    seed_provider_types(db) 