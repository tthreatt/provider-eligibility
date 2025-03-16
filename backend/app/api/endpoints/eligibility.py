from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session, joinedload
from typing import Dict, Any, List
from datetime import datetime
import json

from app.db.session import get_db
from app.models.provider import Provider
from app.models.eligibility_rules import (
    ProviderType as ProviderTypeModel,
    ValidationRule,
    BaseRequirement,
    ProviderRequirement
)
from app.schemas.eligibility import (
    ProviderType as ProviderTypeSchema,
    ProviderTypeCreate,
    Requirement,
    RequirementCreate,
    EligibilityCheck,
    EligibilityResponse
)
from app.services.provider_trust import ProviderTrustAPI

router = APIRouter()

# Create new provider type with requirements
@router.post("/rules", response_model=ProviderTypeSchema)
async def create_provider_type(
    provider_type: ProviderTypeCreate,
    db: Session = Depends(get_db)
):
    # Create provider type
    db_provider_type = ProviderTypeModel(
        code=provider_type.code,
        name=provider_type.name
    )
    db.add(db_provider_type)
    db.flush()

    # Create validation rules and base requirements if they don't exist
    for req in provider_type.requirements:
        # Create or get validation rule
        validation_rule = ValidationRule(
            rule_type=f"{req.requirement_type}_{provider_type.code}",
            rules=json.dumps(req.validation_rules)
        )
        db.add(validation_rule)
        db.flush()

        # Create or get base requirement
        base_req = BaseRequirement(
            requirement_type=req.requirement_type,
            name=req.name,
            description=req.description,
            validation_rule_id=validation_rule.id
        )
        db.add(base_req)
        db.flush()

        # Create provider requirement
        provider_req = ProviderRequirement(
            provider_type_id=db_provider_type.id,
            base_requirement_id=base_req.id,
            is_required=req.is_required,
            override_validation_rules=json.dumps(req.validation_rules) if req.validation_rules else None
        )
        db.add(provider_req)

    db.commit()
    db.refresh(db_provider_type)
    return db_provider_type

# Get all provider types and their requirements
@router.get("/rules", response_model=List[ProviderTypeSchema])
async def get_provider_types(db: Session = Depends(get_db)):
    try:
        provider_types = db.query(ProviderTypeModel)\
            .options(
                joinedload(ProviderTypeModel.requirements)
                .joinedload(ProviderRequirement.base_requirement)
                .joinedload(BaseRequirement.validation_rule)
            ).all()
        
        result = []
        for provider_type in provider_types:
            provider_data = {
                "id": provider_type.id,
                "code": provider_type.code,
                "name": provider_type.name,
                "requirements": []
            }
            
            for requirement in provider_type.requirements:
                base_req = requirement.base_requirement
                
                # Debug: Print the base requirement attributes
                if base_req:
                    print("Base Requirement Attributes:", dir(base_req))
                    print("Base Requirement Dict:", base_req.__dict__)
                
                req_data = {
                    "id": requirement.id,
                    # Use getattr with default values to avoid AttributeError
                    "requirement_type": getattr(base_req, 'requirement_type', '') if base_req else "",
                    "name": getattr(base_req, 'name', '') if base_req else "",
                    "description": getattr(base_req, 'description', '') if base_req else "",
                    "is_required": requirement.is_required,
                    "base_requirement_id": requirement.base_requirement_id,
                    "provider_type_id": requirement.provider_type_id,
                    "validation_rules": {}
                }
                
                if requirement.override_validation_rules:
                    try:
                        req_data["validation_rules"] = json.loads(requirement.override_validation_rules)
                    except json.JSONDecodeError:
                        req_data["validation_rules"] = {}
                elif base_req and base_req.validation_rule:
                    try:
                        req_data["validation_rules"] = json.loads(base_req.validation_rule.rules)
                    except json.JSONDecodeError:
                        req_data["validation_rules"] = {}
                
                provider_data["requirements"].append(req_data)
            
            result.append(provider_data)
        
        return result
        
    except Exception as e:
        print(f"Error in get_provider_types: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Update provider type and requirements
@router.put("/rules/{provider_type_id}", response_model=ProviderTypeSchema)
async def update_provider_type(
    provider_type_id: int,
    provider_type: ProviderTypeCreate,
    db: Session = Depends(get_db)
):
    db_provider_type = db.query(ProviderTypeModel).filter(ProviderTypeModel.id == provider_type_id).first()
    if not db_provider_type:
        raise HTTPException(status_code=404, detail="Provider type not found")

    # Update provider type
    db_provider_type.code = provider_type.code
    db_provider_type.name = provider_type.name

    # Delete existing provider requirements
    db.query(ProviderRequirement).filter(ProviderRequirement.provider_type_id == provider_type_id).delete()

    # Add new requirements
    for req in provider_type.requirements:
        # Create or get validation rule
        validation_rule = ValidationRule(
            rule_type=f"{req.requirement_type}_{provider_type.code}",
            rules=json.dumps(req.validation_rules)
        )
        db.add(validation_rule)
        db.flush()

        # Create or get base requirement
        base_req = BaseRequirement(
            requirement_type=req.requirement_type,
            name=req.name,
            description=req.description,
            validation_rule_id=validation_rule.id
        )
        db.add(base_req)
        db.flush()

        # Create provider requirement
        provider_req = ProviderRequirement(
            provider_type_id=db_provider_type.id,
            base_requirement_id=base_req.id,
            is_required=req.is_required,
            override_validation_rules=json.dumps(req.validation_rules) if req.validation_rules else None
        )
        db.add(provider_req)

    db.commit()
    db.refresh(db_provider_type)
    return db_provider_type

# Delete provider type and its requirements
@router.delete("/rules/{provider_type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_provider_type(
    provider_type_id: int,
    db: Session = Depends(get_db)
):
    db_provider_type = db.query(ProviderTypeModel).filter(ProviderTypeModel.id == provider_type_id).first()
    if not db_provider_type:
        raise HTTPException(status_code=404, detail="Provider type not found")

    # Delete provider requirements first
    db.query(ProviderRequirement).filter(ProviderRequirement.provider_type_id == provider_type_id).delete()
    db.delete(db_provider_type)
    db.commit()
    return {"ok": True}

# Check eligibility endpoint (updated to use rules)
@router.post("/check", response_model=EligibilityResponse)
async def check_eligibility(
    request: EligibilityCheck,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    try:
        # Get provider data from ProviderTrust
        provider_trust = ProviderTrustAPI()
        provider_data = await provider_trust.search_profile(request.npi)

        # Get provider type from the response
        provider_type_name = provider_data.get("rawApiResponse", {}).get("NPI Validation", {}).get("providerType")
        if not provider_type_name:
            raise HTTPException(status_code=400, detail="Provider type not found in response")

        # Get provider type and its requirements
        provider_type = db.query(ProviderTypeModel)\
            .filter(ProviderTypeModel.code == provider_type_name.lower().replace(" ", "_"))\
            .first()
        
        if not provider_type:
            raise HTTPException(status_code=400, detail="No eligibility rules found for this provider type")

        # Check each requirement against provider data
        requirements_status = {}
        is_eligible = True

        for provider_req in provider_type.requirements:
            base_req = provider_req.base_requirement
            validation_rule = base_req.validation_rule
            
            # Use override rules if they exist, otherwise use base validation rules
            rules = json.loads(provider_req.override_validation_rules) if provider_req.override_validation_rules \
                else json.loads(validation_rule.rules)
            
            requirement_met = check_requirement(
                provider_data, 
                base_req.requirement_type,
                rules
            )
            requirements_status[base_req.requirement_type] = requirement_met
            if provider_req.is_required and not requirement_met:
                is_eligible = False

        # Format response
        response = {
            "isEligible": is_eligible,
            "requirements": {
                "stateLicense": requirements_status.get("license", False),
                "deaCds": requirements_status.get("registration", False),
                "boardCertification": requirements_status.get("certification", False),
                "providerType": provider_type_name
            },
            "rawApiResponse": provider_data
        }

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def check_requirement(provider_data: Dict, requirement_type: str, rules: Dict) -> bool:
    if requirement_type == "license":
        return check_license_requirement(provider_data, rules)
    elif requirement_type == "certification":
        return check_certification_requirement(provider_data, rules)
    elif requirement_type == "registration":
        return check_registration_requirement(provider_data, rules)
    return False

# Add helper functions for checking specific requirements
def check_license_requirement(provider_data: Dict, rules: Dict) -> bool:
    if not provider_data.get("licenses", []):
        return False
    
    for license in provider_data["licenses"]:
        if (license.get("category") == rules.get("license_type") and
            license.get("status", "").lower() == "active" and
            datetime.strptime(license.get("expirationDate", ""), "%Y-%m-%d") > datetime.utcnow()):
            return True
    return False

def check_certification_requirement(provider_data: Dict, rules: Dict) -> bool:
    if not provider_data.get("licenses", []):
        return False
    
    for license in provider_data["licenses"]:
        if (license.get("category") == rules.get("certification_type") and
            license.get("status", "").lower() == "active" and
            datetime.strptime(license.get("expirationDate", ""), "%Y-%m-%d") > datetime.utcnow()):
            return True
    return False

def check_registration_requirement(provider_data: Dict, rules: Dict) -> bool:
    if not provider_data.get("licenses", []):
        return False
    
    for license in provider_data["licenses"]:
        if (license.get("category") == rules.get("registration_type") and
            license.get("status", "").lower() == "active" and
            datetime.strptime(license.get("expirationDate", ""), "%Y-%m-%d") > datetime.utcnow()):
            return True
    return False 