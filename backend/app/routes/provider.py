from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.provider_trust import ProviderTrustAPI

router = APIRouter()
provider_trust = ProviderTrustAPI()


class NPIRequest(BaseModel):
    npi: str


@router.post("/api/fetch-provider-data")
async def fetch_provider_data(request: NPIRequest):
    try:
        # Use the provider_trust service to get the data
        api_data = await provider_trust.search_profile(request.npi)

        # If we get here and api_data indicates an error, raise an exception
        if isinstance(api_data, dict) and "error" in api_data:
            raise HTTPException(
                status_code=api_data.get("status", 500),
                detail=api_data.get("message", "Unknown error occurred"),
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

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


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
