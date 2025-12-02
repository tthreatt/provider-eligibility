import json
import logging
import traceback
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.eligibility_rules import (
    BaseRequirement,
    ProviderRequirement,
    ProviderType as ProviderTypeModel,
    ValidationRule,
)
from app.schemas.eligibility import (
    EligibilityCheck,
    EligibilityResponse,
    ProviderType as ProviderTypeSchema,
    ProviderTypeCreate,
    RequirementBase,
)
from app.services.provider_trust import ProviderTrustAPI

logger = logging.getLogger(__name__)

router = APIRouter()


# Create new provider type with requirements
@router.post("/rules", response_model=ProviderTypeSchema)
async def create_provider_type(
    provider_type: ProviderTypeCreate, db: Session = Depends(get_db)
):
    # Create provider type
    db_provider_type = ProviderTypeModel(
        code=provider_type.code, name=provider_type.name
    )
    db.add(db_provider_type)
    db.flush()

    # Create validation rules and base requirements if they don't exist
    for req in provider_type.requirements:
        # Create or get validation rule
        validation_rule = ValidationRule(
            rule_type=f"{req.requirement_type}_{provider_type.code}",
            rules=json.dumps(req.validation_rules),
        )
        db.add(validation_rule)
        db.flush()

        # Create or get base requirement
        base_req = BaseRequirement(
            requirement_type=req.requirement_type,
            name=req.name,
            description=req.description,
            validation_rule_id=validation_rule.id,
        )
        db.add(base_req)
        db.flush()

        # Create provider requirement
        provider_req = ProviderRequirement(
            provider_type_id=db_provider_type.id,
            base_requirement_id=base_req.id,
            is_required=req.is_required,
            override_validation_rules=json.dumps(req.validation_rules)
            if req.validation_rules
            else None,
        )
        db.add(provider_req)

    db.commit()
    db.refresh(db_provider_type)
    return db_provider_type


# Get all provider types and their requirements
@router.get("/rules", response_model=list[ProviderTypeSchema])
async def get_provider_types(db: Session = Depends(get_db)):
    try:
        provider_types = (
            db.query(ProviderTypeModel)
            .options(
                joinedload(ProviderTypeModel.requirements)
                .joinedload(ProviderRequirement.base_requirement)
                .joinedload(BaseRequirement.validation_rule)
            )
            .all()
        )

        result = []
        for provider_type in provider_types:
            logger.debug(f"Processing provider type: {provider_type.name}")
            provider_data = {
                "id": provider_type.id,
                "code": provider_type.code,
                "name": provider_type.name,
                "requirements": [],
            }

            for requirement in provider_type.requirements:
                logger.debug(f"Processing requirement: {requirement.id}")
                base_req = requirement.base_requirement

                if base_req:
                    logger.debug(
                        f"Base requirement: type={base_req.requirement_type}, "
                        f"name={base_req.name}"
                    )

                # Get fields from base requirement
                req_data = {
                    "id": requirement.id,
                    "requirement_type": base_req.requirement_type if base_req else "",
                    "name": base_req.name if base_req else "",
                    "description": base_req.description if base_req else "",
                    "is_required": requirement.is_required,
                    "base_requirement_id": requirement.base_requirement_id,
                    "provider_type_id": requirement.provider_type_id,
                    "validation_rules": {},
                }

                # Try to get validation rules from requirement first
                if requirement.override_validation_rules:
                    try:
                        logger.debug("Using override validation rules")
                        req_data["validation_rules"] = json.loads(
                            requirement.override_validation_rules
                        )
                    except (json.JSONDecodeError, TypeError) as e:
                        logger.warning(f"Error parsing override rules: {e}")
                        req_data["validation_rules"] = {}
                # Fall back to base requirement validation rules
                elif base_req and base_req.validation_rule and base_req.validation_rule.rules:
                    try:
                        logger.debug("Using base validation rules")
                        req_data["validation_rules"] = json.loads(
                            base_req.validation_rule.rules
                        )
                    except (json.JSONDecodeError, TypeError) as e:
                        logger.warning(f"Error parsing base rules: {e}")
                        req_data["validation_rules"] = {}

                provider_data["requirements"].append(req_data)

            result.append(provider_data)

        return result

    except Exception as e:
        logger.error(f"Error in get_provider_types: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) from e


# Get a single provider type by ID
@router.get("/rules/{provider_type_id}", response_model=ProviderTypeSchema)
async def get_provider_type(provider_type_id: int, db: Session = Depends(get_db)):
    try:
        logger.debug(f"Fetching provider type with ID: {provider_type_id}")

        # Query the provider type with all related data
        provider_type = (
            db.query(ProviderTypeModel)
            .options(
                joinedload(ProviderTypeModel.requirements)
                .joinedload(ProviderRequirement.base_requirement)
                .joinedload(BaseRequirement.validation_rule)
            )
            .filter(ProviderTypeModel.id == provider_type_id)
            .first()
        )

        if not provider_type:
            raise HTTPException(
                status_code=404,
                detail=f"Provider type with ID {provider_type_id} not found",
            )

        # Format the response data to match the schema
        response_data = {
            "id": provider_type.id,
            "code": provider_type.code,
            "name": provider_type.name,
            "requirements": [],
        }

        # Process each requirement
        for requirement in provider_type.requirements:
            base_req = requirement.base_requirement

            if base_req:
                logger.debug(
                    f"Processing requirement {requirement.id}: "
                    f"type={base_req.requirement_type}"
                )

            req_data = {
                "id": requirement.id,
                "requirement_type": getattr(base_req, "requirement_type", "")
                if base_req
                else "",
                "name": getattr(base_req, "name", "") if base_req else "",
                "description": getattr(base_req, "description", "") if base_req else "",
                "is_required": requirement.is_required,
                "base_requirement_id": requirement.base_requirement_id,
                "provider_type_id": requirement.provider_type_id,
                "validation_rules": {},
            }

            # Handle validation rules with proper error handling
            if requirement.override_validation_rules:
                try:
                    req_data["validation_rules"] = json.loads(
                        requirement.override_validation_rules
                    )
                except (json.JSONDecodeError, TypeError) as e:
                    logger.warning(f"Error parsing override validation rules: {e}")
                    req_data["validation_rules"] = {}
            elif base_req and base_req.validation_rule and base_req.validation_rule.rules:
                try:
                    req_data["validation_rules"] = json.loads(
                        base_req.validation_rule.rules
                    )
                except (json.JSONDecodeError, TypeError) as e:
                    logger.warning(f"Error parsing base validation rules: {e}")
                    req_data["validation_rules"] = {}

            response_data["requirements"].append(req_data)

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error fetching provider type {provider_type_id}: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch provider type: {str(e)}"
        ) from e


# Update provider type and requirements
@router.put("/rules/{provider_type_id}", response_model=ProviderTypeSchema)
async def update_provider_type(
    provider_type_id: int,
    provider_type: ProviderTypeCreate,
    db: Session = Depends(get_db),
):
    try:
        logger.info(f"Received update request for provider type {provider_type_id}")
        logger.debug(f"Request data: {provider_type.dict()}")

        db_provider_type = (
            db.query(ProviderTypeModel)
            .filter(ProviderTypeModel.id == provider_type_id)
            .first()
        )
        if not db_provider_type:
            raise HTTPException(status_code=404, detail="Provider type not found")

        # Update provider type basic info
        db_provider_type.code = provider_type.code
        db_provider_type.name = provider_type.name

        # Get existing provider requirements to preserve relationships
        existing_requirements = (
            db.query(ProviderRequirement)
            .filter(ProviderRequirement.provider_type_id == provider_type_id)
            .all()
        )

        # Create a map of requirement types to existing requirements
        existing_req_map = {
            req.base_requirement.requirement_type: req
            for req in existing_requirements
            if req.base_requirement
        }

        # Delete existing provider requirements
        db.query(ProviderRequirement).filter(
            ProviderRequirement.provider_type_id == provider_type_id
        ).delete()

        new_requirements = []
        for req in provider_type.requirements:
            # Try to find existing validation rule
            rule_type = f"{req.requirement_type}_{provider_type.code}"
            existing_validation_rule = (
                db.query(ValidationRule)
                .filter(ValidationRule.rule_type == rule_type)
                .first()
            )

            # Update or create validation rule
            if existing_validation_rule:
                existing_validation_rule.rules = json.dumps(req.validation_rules)
                validation_rule = existing_validation_rule
            else:
                validation_rule = ValidationRule(
                    rule_type=rule_type, rules=json.dumps(req.validation_rules)
                )
                db.add(validation_rule)

            db.flush()  # Ensure validation rule has an ID

            # Try to find existing base requirement
            existing_base_req = None
            if req.requirement_type in existing_req_map:
                existing_base_req = existing_req_map[
                    req.requirement_type
                ].base_requirement

            # Update or create base requirement
            if existing_base_req:
                existing_base_req.name = req.name or ""  # Ensure name is never None
                existing_base_req.description = (
                    req.description or ""
                )  # Ensure description is never None
                existing_base_req.validation_rule_id = validation_rule.id
                base_req = existing_base_req
            else:
                base_req = BaseRequirement(
                    requirement_type=req.requirement_type,
                    name=req.name or "",  # Ensure name is never None
                    description=req.description
                    or "",  # Ensure description is never None
                    validation_rule_id=validation_rule.id,
                )
                db.add(base_req)

            db.flush()  # Ensure base requirement has an ID

            # Create new provider requirement
            provider_req = ProviderRequirement(
                provider_type_id=db_provider_type.id,
                base_requirement_id=base_req.id,
                is_required=req.is_required,
                override_validation_rules=json.dumps(req.validation_rules)
                if req.validation_rules
                else None,
            )
            new_requirements.append(provider_req)
            db.add(provider_req)

        db.commit()

        # Format the response data manually to match the schema
        response_data = {
            "id": db_provider_type.id,
            "code": db_provider_type.code,
            "name": db_provider_type.name,
            "requirements": [],
        }

        # Fetch and format requirements
        updated_requirements = (
            db.query(ProviderRequirement)
            .filter(ProviderRequirement.provider_type_id == provider_type_id)
            .join(BaseRequirement)
            .all()
        )

        for req in updated_requirements:
            base_req = req.base_requirement
            req_data = {
                "id": req.id,
                "requirement_type": base_req.requirement_type,
                "name": base_req.name or "",  # Ensure name is never None
                "description": base_req.description
                or "",  # Ensure description is never None
                "is_required": req.is_required,
                "base_requirement_id": req.base_requirement_id,
                "provider_type_id": req.provider_type_id,
                "validation_rules": json.loads(req.override_validation_rules)
                if req.override_validation_rules
                else {},
            }
            response_data["requirements"].append(req_data)

        return response_data

    except Exception as e:
        db.rollback()
        logger.error(f"Error updating provider type: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to update provider type: {str(e)}"
        ) from e


# Delete provider type and its requirements
@router.delete("/rules/{provider_type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_provider_type(provider_type_id: int, db: Session = Depends(get_db)):
    db_provider_type = (
        db.query(ProviderTypeModel)
        .filter(ProviderTypeModel.id == provider_type_id)
        .first()
    )
    if not db_provider_type:
        raise HTTPException(status_code=404, detail="Provider type not found")

    # Delete provider requirements first
    db.query(ProviderRequirement).filter(
        ProviderRequirement.provider_type_id == provider_type_id
    ).delete()
    db.delete(db_provider_type)
    db.commit()
    return {"ok": True}


# Check eligibility endpoint (updated to use rules)
@router.post("/check", response_model=EligibilityResponse)
async def check_eligibility(
    request: EligibilityCheck, db: Session = Depends(get_db)
) -> dict[str, Any]:
    try:
        # Get provider data from ProviderTrust
        provider_trust = ProviderTrustAPI()
        provider_data = await provider_trust.search_profile(request.npi)

        # Get provider type from the response
        # Try rawApiResponse structure first, then fallback to direct structure
        provider_type_name = None

        # Check if response has rawApiResponse wrapper
        if "rawApiResponse" in provider_data:
            provider_type_name = (
                provider_data.get("rawApiResponse", {})
                .get("NPI Validation", {})
                .get("providerType")
            )

        # Fallback: check direct structure
        if not provider_type_name:
            npi_validation = provider_data.get("NPI Validation", {})
            provider_type_name = npi_validation.get("providerType")

        if not provider_type_name:
            raise HTTPException(
                status_code=400, detail="Provider type not found in response"
            )

        # Get provider type and its requirements
        provider_type = (
            db.query(ProviderTypeModel)
            .filter(
                ProviderTypeModel.code == provider_type_name.lower().replace(" ", "_")
            )
            .first()
        )

        if not provider_type:
            raise HTTPException(
                status_code=400,
                detail="No eligibility rules found for this provider type",
            )

        # Check each requirement against provider data
        requirements_status = {}
        is_eligible = True

        for provider_req in provider_type.requirements:
            base_req = provider_req.base_requirement

            # Skip if base requirement is missing
            if not base_req:
                continue

            validation_rule = base_req.validation_rule

            # Use override rules if they exist, otherwise use base validation rules
            try:
                if provider_req.override_validation_rules:
                    rules = json.loads(provider_req.override_validation_rules)
                elif validation_rule and validation_rule.rules:
                    rules = json.loads(validation_rule.rules)
                else:
                    # Skip if no validation rules available
                    continue
            except (json.JSONDecodeError, TypeError, AttributeError):
                # Skip this requirement if rules can't be parsed
                continue

            requirement_met = check_requirement(
                provider_data, base_req.requirement_type, rules
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
                "providerType": provider_type_name,
            },
            "rawApiResponse": provider_data,
        }

        return response

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the full error for debugging
        logger.error(
            f"Error in check_eligibility endpoint: {str(e)}\n{traceback.format_exc()}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail=str(e)) from e


def check_requirement(provider_data: dict, requirement_type: str, rules: dict) -> bool:
    if requirement_type == "license":
        return check_license_requirement(provider_data, rules)
    elif requirement_type == "certification":
        return check_certification_requirement(provider_data, rules)
    elif requirement_type == "registration":
        return check_registration_requirement(provider_data, rules)
    return False


# Add helper functions for checking specific requirements
def check_license_requirement(provider_data: dict, rules: dict) -> bool:
    if not provider_data.get("licenses", []):
        return False

    for license in provider_data["licenses"]:
        expiration_date_str = license.get("expirationDate")
        if not expiration_date_str:
            continue  # Skip licenses without expiration dates

        try:
            expiration_date = datetime.strptime(expiration_date_str, "%Y-%m-%d")
            if (
                license.get("category") == rules.get("license_type")
                and license.get("status", "").lower() == "active"
                and expiration_date > datetime.utcnow()
            ):
                return True
        except (ValueError, TypeError):
            # Invalid date format, skip this license
            logger.warning(
                f"Invalid expiration date format for license: {expiration_date_str}"
            )
            continue
    return False


def check_certification_requirement(provider_data: dict, rules: dict) -> bool:
    if not provider_data.get("licenses", []):
        return False

    for license in provider_data["licenses"]:
        expiration_date_str = license.get("expirationDate")
        if not expiration_date_str:
            continue  # Skip certifications without expiration dates

        try:
            expiration_date = datetime.strptime(expiration_date_str, "%Y-%m-%d")
            if (
                license.get("category") == rules.get("certification_type")
                and license.get("status", "").lower() == "active"
                and expiration_date > datetime.utcnow()
            ):
                return True
        except (ValueError, TypeError):
            # Invalid date format, skip this certification
            logger.warning(
                f"Invalid expiration date format for certification: {expiration_date_str}"
            )
            continue
    return False


def check_registration_requirement(provider_data: dict, rules: dict) -> bool:
    if not provider_data.get("licenses", []):
        return False

    for license in provider_data["licenses"]:
        expiration_date_str = license.get("expirationDate")
        if not expiration_date_str:
            continue  # Skip registrations without expiration dates

        try:
            expiration_date = datetime.strptime(expiration_date_str, "%Y-%m-%d")
            if (
                license.get("category") == rules.get("registration_type")
                and license.get("status", "").lower() == "active"
                and expiration_date > datetime.utcnow()
            ):
                return True
        except (ValueError, TypeError):
            # Invalid date format, skip this registration
            logger.warning(
                f"Invalid expiration date format for registration: {expiration_date_str}"
            )
            continue
    return False


# Get all base requirements
@router.get("/base-requirements", response_model=list[RequirementBase])
async def get_base_requirements(db: Session = Depends(get_db)):
    try:
        base_requirements = (
            db.query(BaseRequirement)
            .options(joinedload(BaseRequirement.validation_rule))
            .all()
        )

        result = []
        for req in base_requirements:
            # Safely parse validation rules
            validation_rules = {}
            if req.validation_rule and req.validation_rule.rules:
                try:
                    validation_rules = json.loads(req.validation_rule.rules)
                except (json.JSONDecodeError, TypeError):
                    logger.warning(
                        f"Failed to parse validation rules for requirement {req.id}: {req.validation_rule.rules}"
                    )
                    validation_rules = {}

            req_data = {
                "id": req.id,
                "requirement_type": req.requirement_type,
                "name": req.name,
                "description": req.description,
                "validation_rules": validation_rules,
            }
            result.append(req_data)

        return result
    except Exception as e:
        logger.error(f"Error in get_base_requirements: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) from e
