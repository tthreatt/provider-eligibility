from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.provider_trust import ProviderTrustAPI

router = APIRouter()
provider_trust = ProviderTrustAPI()


class NPIRequest(BaseModel):
    npi: str


@router.post("/api/fetch-provider-data")
async def fetch_provider_data(request: NPIRequest):
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Fetching provider data for NPI: {request.npi}")
        
        # Use the provider_trust service to get the data
        api_data = await provider_trust.search_profile(request.npi)

        # Validate response is a dictionary
        if not isinstance(api_data, dict):
            logger.error(f"ProviderTrust API returned unexpected response type: {type(api_data)}")
            raise HTTPException(
                status_code=500,
                detail=f"ProviderTrust API returned invalid response format: {type(api_data)}"
            )

        # If we get here and api_data indicates an error, raise an exception
        if api_data.get("error"):
            error_status = api_data.get("status", 500)
            error_message = api_data.get("message", "Unknown error occurred")
            error_details = api_data.get("details", "")
            
            logger.error(
                f"ProviderTrust API returned error: status={error_status}, "
                f"message={error_message}, details={error_details[:200] if error_details else 'None'}"
            )
            
            # Include details in the error message if available
            detail_message = error_message
            if error_details:
                detail_message = f"{error_message}. Details: {error_details[:200]}"
            
            raise HTTPException(
                status_code=error_status,
                detail=detail_message,
            )

        npi_validation = api_data.get("NPI Validation", {})

        # Check for any disqualifying conditions
        has_exclusions = len(api_data.get("Exclusions", [])) > 0
        has_preclusions = len(api_data.get("CMS Preclusion List", [])) > 0
        has_opt_out = bool(api_data.get("Opt Out"))

        # Get provider type from license code
        provider_type = None
        licenses = npi_validation.get("licenses", [])
        if licenses:
            provider_type = (
                licenses[0]["code"].split(" - ")[1]
                if " - " in licenses[0]["code"]
                else licenses[0]["code"]
            )

        # Calculate individual requirements
        has_state_license = len(api_data.get("Licenses", [])) > 0
        has_dea_cds = _has_valid_identifiers(api_data)
        is_board_certified = _is_board_certified(api_data)

        # Update is_eligible to check all requirements
        is_eligible = (
            not has_exclusions
            and not has_preclusions
            and not has_opt_out
            and has_state_license
            and has_dea_cds
            and is_board_certified
        )

        return {
            "isEligible": is_eligible,
            "requirements": {
                "stateLicense": has_state_license,
                "deaCds": has_dea_cds,
                "boardCertification": is_board_certified,
                "providerType": provider_type or "Unknown",
            },
            "rawApiResponse": api_data,
        }

    except HTTPException:
        # Re-raise HTTPExceptions as-is (they already have proper status codes)
        raise
    except Exception as e:
        # Log the full exception for debugging
        logger.error(
            f"Unexpected error in fetch_provider_data for NPI {request.npi}: {str(e)}", 
            exc_info=True
        )
        
        # Return a user-friendly error message
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error while fetching provider data: {str(e)}"
        ) from e


def _check_provider_eligibility(provider_data):
    # Basic eligibility check - can be expanded based on specific requirements
    return (
        provider_data.get("status") == "A"  # Active status
        and provider_data.get("taxonomies")  # Has taxonomies
    )


def _has_active_licenses(provider_data):
    licenses = provider_data.get("licenses", [])
    return any(license.get("status") == "ACTIVE" for license in licenses)


def _has_valid_identifiers(provider_data):
    identifiers = provider_data.get("identifiers", [])
    return any(
        identifier.get("type") in ["DEA", "CDS"]
        and identifier.get("status") == "ACTIVE"
        for identifier in identifiers
    )


def _is_board_certified(provider_data):
    taxonomies = provider_data.get("taxonomies", [])
    return any(
        taxonomy.get("primary") is True and taxonomy.get("state") == "Active"
        for taxonomy in taxonomies
    )
