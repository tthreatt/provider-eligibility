from datetime import datetime

from app.models.eligibility_rules import RequirementRule


def validate_requirement(requirement: RequirementRule, submitted_data: dict) -> bool:
    rules = requirement.validation_rules

    if not submitted_data:
        return not requirement.is_required

    if rules.get("must_be_active") and not submitted_data.get("is_active"):
        return False

    if rules.get("must_be_current") and not submitted_data.get("is_current"):
        return False

    if rules.get("must_be_completed") and not submitted_data.get("completed_date"):
        return False

    if rules.get("must_be_verified") and not submitted_data.get("verification_status"):
        return False

    if rules.get("must_be_accredited") and not submitted_data.get(
        "accreditation_status"
    ):
        return False

    if rules.get("must_be_unrestricted") and not submitted_data.get("is_unrestricted"):
        return False

    if rules.get("must_be_valid") and not submitted_data.get("is_valid"):
        return False

    if rules.get("verification_required") and not submitted_data.get("is_verified"):
        return False

    if rules.get("verification_period_years"):
        if not submitted_data.get("verification_date"):
            return False
        years_ago = datetime.now() - submitted_data["verification_date"]
        if years_ago.days > (rules["verification_period_years"] * 365):
            return False

    if rules.get("minimum_references"):
        if len(submitted_data.get("references", [])) < rules["minimum_references"]:
            return False

    if rules.get("degree_types"):
        if submitted_data.get("degree_type") not in rules["degree_types"]:
            return False

    # Add similar checks for other rule types

    return True
