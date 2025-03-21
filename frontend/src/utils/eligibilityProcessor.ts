import { ProcessedEligibility, Requirement, NPIValidation } from '../types/eligibility';

export function processEligibilityData(rawData: any): ProcessedEligibility {
  const npiValidation: NPIValidation = {
    npiDetails: {
      providerName: rawData.providerName || '',
      npi: rawData.npi || '',
      updateDate: rawData.updateDate || new Date().toISOString(),
      providerType: rawData.providerType,
      licenses: rawData.licenses || [],
    }
  };

  // Process requirements based on provider type and licenses
  const requirements: Requirement[] = [];
  
  // Basic NPI requirement
  requirements.push({
    requirement_type: 'NPI',
    name: 'Valid NPI Number',
    description: 'Provider must have a valid NPI number',
    is_required: true,
    is_valid: Boolean(npiValidation.npiDetails.npi),
    validation_message: npiValidation.npiDetails.npi ? 'Valid NPI found' : 'No valid NPI found',
    validation_rules: {
      required: true,
      format: 'number',
      length: 10
    },
    base_requirement_id: 1,
    provider_type_id: 1,
    id: 1,
    severity: 1
  });

  // Process license requirements if available
  if (npiValidation.npiDetails.licenses && npiValidation.npiDetails.licenses.length > 0) {
    npiValidation.npiDetails.licenses.forEach((license, index) => {
      if (license.number && license.state) {
        requirements.push({
          requirement_type: 'LICENSE',
          name: `State License - ${license.state}`,
          description: `Valid medical license in ${license.state}`,
          is_required: true,
          is_valid: Boolean(license.number && license.status?.toLowerCase() === 'active'),
          validation_message: license.status?.toLowerCase() === 'active' 
            ? `Valid license found: ${license.number}`
            : `License ${license.number} is not active`,
          validation_rules: {
            required: true,
            status: 'active'
          },
          details: {
            issuer: license.state,
            number: license.number,
            status: license.status,
            expirationDate: license.expirationDate
          },
          base_requirement_id: 2 + index,
          provider_type_id: 1,
          id: 2 + index,
          severity: 1
        });
      }
    });
  }

  // Determine overall eligibility
  const isEligible = requirements.every(req => !req.is_required || req.is_valid);

  return {
    isEligible,
    requirements,
    rawValidation: npiValidation,
    providerType: npiValidation.npiDetails.providerType
  };
} 