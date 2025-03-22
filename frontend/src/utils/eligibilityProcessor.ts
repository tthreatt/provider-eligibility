import { ProcessedEligibility, Requirement, NPIValidation } from '../types/eligibility';
import { getFullStateName } from './stateAbbreviations';

interface RawLicense {
  category: string;
  state?: string;
  issuer?: string;
  type?: string;
  number?: string;
  status?: string;
  expirationDate?: string;
  boardActionData?: {
    boardActionTexts?: string[];
  };
}

interface CleanLicense {
  issuer: string;
  type: string;
  number: string;
  status: string;
  expirationDate: string | null;
  boardActions: string[];
  hasBoardAction: boolean;
}

interface RawApiResponse {
  'NPI Validation': {
    npi: string;
    providerName: string;
    updateDate: string;
    entityType: string;
    enumerationDate: string;
  };
  'Licenses': RawLicense[];
  'Verifications': any[];
}

interface ValidationDetail {
  issuer: string;
  type: string;
  number: string;
  status: string;
  expirationDate: string | null;
  boardActions: string[];
  hasBoardAction: boolean;
}

interface ValidationResult {
  is_valid: boolean;
  validation_message: string;
  details?: {
    multipleDetails?: ValidationDetail[];
  } | ValidationDetail;
}

export const formatExpirationDate = (date: string | null | undefined): string => {
  if (!date) return 'No expiration date';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return 'Invalid date';
  }
};

export const isValidDate = (date: string | undefined): boolean => {
  if (!date) return false;
  try {
    new Date(date);
    return true;
  } catch {
    return false;
  }
};

export const cleanRawApiResponse = (response: any): RawApiResponse => {
  const cleanedResponse = { ...response };
  
  // Clean Licenses array - remove numeric indices and invalid entries
  if (Array.isArray(cleanedResponse['Licenses'])) {
    cleanedResponse['Licenses'] = cleanedResponse['Licenses']
      .filter((license): license is RawLicense => 
        license && 
        typeof license === 'object' && 
        !Array.isArray(license) &&
        typeof license.category === 'string'
      );
  } else {
    cleanedResponse['Licenses'] = [];
  }

  return cleanedResponse as RawApiResponse;
};

export const cleanLicenseData = (license: RawLicense): CleanLicense | null => {
  if (!license || typeof license !== 'object') return null;

  // Handle state licenses specifically
  const issuer = license.category === 'state_license'
    ? getFullStateName(license.state || '')
    : license.issuer || 'Unknown Issuer';

  // Don't create license objects with default/empty values only
  if (
    issuer === 'Unknown Issuer' &&
    !license.type &&
    !license.number &&
    !license.status &&
    !license.expirationDate &&
    !license.boardActionData?.boardActionTexts?.length
  ) {
    return null;
  }

  return {
    issuer,
    type: license.type || 'Unknown Type',
    number: license.number || 'Not Available',
    status: license.status || 'Unknown',
    expirationDate: license.expirationDate || null,
    boardActions: license.boardActionData?.boardActionTexts || [],
    hasBoardAction: Boolean(license.boardActionData?.boardActionTexts?.length)
  };
};

export const processRequirementDetails = (requirement: any, licenses: RawLicense[]): { multipleDetails: ValidationDetail[] } | undefined => {
  if (!Array.isArray(licenses)) return undefined;

  switch (requirement.requirement_type.toLowerCase()) {
    case 'license':
      const stateLicenses = licenses
        .filter(l => l.category === 'state_license')
        .map(cleanLicenseData)
        .filter((l): l is CleanLicense => l !== null);
      return stateLicenses.length > 0 ? { multipleDetails: stateLicenses } : undefined;

    case 'registration':
      const deaLicenses = licenses
        .filter(l => l.category === 'controlled_substance_registration')
        .map(cleanLicenseData)
        .filter((l): l is CleanLicense => l !== null);
      return deaLicenses.length > 0 ? { multipleDetails: deaLicenses } : undefined;

    case 'certification':
      if (requirement.name.toLowerCase().includes('cpr')) {
        const cprCerts = licenses
          .filter(l => 
            l.category === 'certification' && 
            l.type?.toLowerCase() === 'cpr certification' &&
            l.issuer?.toLowerCase().includes('heart association')
          )
          .map(cleanLicenseData)
          .filter((l): l is CleanLicense => l !== null);
        return cprCerts.length > 0 ? { multipleDetails: cprCerts } : undefined;
      } else {
        const boardCerts = licenses
          .filter(l => 
            l.category === 'board_certification' &&
            l.issuer?.toLowerCase().includes('abms')
          )
          .map(cleanLicenseData)
          .filter((l): l is CleanLicense => l !== null);
        return boardCerts.length > 0 ? { multipleDetails: boardCerts } : undefined;
      }

    default:
      return undefined;
  }
};

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

export const validateRequirement = (requirement: any, providerData: { rawApiResponse: RawApiResponse }): ValidationResult => {
  const licenses = providerData.rawApiResponse['Licenses'];
  const verifications = providerData.rawApiResponse['Verifications'] || [];
  
  switch (requirement.requirement_type.toLowerCase()) {
    case 'identifier':
      return {
        is_valid: Boolean(providerData.rawApiResponse['NPI Validation']?.npi),
        validation_message: 'Valid NPI number',
        details: {
          issuer: 'CMS',
          type: 'NPI',
          number: providerData.rawApiResponse['NPI Validation'].npi || 'Not Available',
          status: 'Active',
          expirationDate: null,
          boardActions: [],
          hasBoardAction: false
        }
      };

    case 'license':
    case 'registration':
    case 'certification':
      const details = processRequirementDetails(requirement, licenses);
      const activeItems = details?.multipleDetails?.filter(
        item => item.status.toLowerCase() === 'active'
      ) || [];
      
      return {
        is_valid: activeItems.length > 0,
        validation_message: activeItems.length > 0 
          ? `Valid ${requirement.name.toLowerCase()}`
          : `No valid ${requirement.name.toLowerCase()} found`,
        details
      };

    case 'continuing_education':
      const ceVerification = verifications.find((v: any) => v.type === 'continuing_education');
      return {
        is_valid: Boolean(ceVerification?.verified),
        validation_message: 'Required continuing education credits',
        details: ceVerification?.verified ? {
          issuer: ceVerification.provider || 'Unknown Provider',
          type: 'Continuing Education',
          number: `${ceVerification.credits || 0} credits`,
          status: ceVerification.verified ? 'Verified' : 'Not Verified',
          expirationDate: ceVerification.completionDate || null,
          boardActions: [],
          hasBoardAction: false
        } : undefined
      };

    case 'insurance':
      const malpracticeVerification = verifications.find((v: any) => v.type === 'malpractice_insurance');
      return {
        is_valid: Boolean(malpracticeVerification?.verified),
        validation_message: 'Current malpractice insurance coverage',
        details: malpracticeVerification?.verified ? {
          issuer: malpracticeVerification.provider || 'Unknown Provider',
          type: 'Malpractice Insurance',
          number: malpracticeVerification.policyNumber || 'Not Available',
          status: malpracticeVerification.verified ? 'Active' : 'Inactive',
          expirationDate: malpracticeVerification.expirationDate || null,
          boardActions: [],
          hasBoardAction: false
        } : undefined
      };

    case 'background_check':
      const backgroundCheck = verifications.find((v: any) => v.type === 'background_check');
      return {
        is_valid: Boolean(backgroundCheck?.verified),
        validation_message: 'Background check and verification',
        details: backgroundCheck?.verified ? {
          issuer: backgroundCheck.provider || 'Unknown Provider',
          type: 'Background Check',
          number: 'N/A',
          status: backgroundCheck.verified ? 'Verified' : 'Not Verified',
          expirationDate: backgroundCheck.completionDate || null,
          boardActions: [],
          hasBoardAction: false
        } : undefined
      };

    case 'immunization':
      const immunizationVerification = verifications.find((v: any) => v.type === 'immunization');
      return {
        is_valid: Boolean(immunizationVerification?.verified),
        validation_message: 'Current immunization records',
        details: immunizationVerification?.verified ? {
          issuer: immunizationVerification.provider || 'Unknown Provider',
          type: 'Immunization Records',
          number: 'N/A',
          status: immunizationVerification.verified ? 'Verified' : 'Not Verified',
          expirationDate: immunizationVerification.verificationDate || null,
          boardActions: [],
          hasBoardAction: false
        } : undefined
      };

    case 'professional_references':
      const referencesVerification = verifications.find((v: any) => v.type === 'professional_references');
      return {
        is_valid: Boolean(referencesVerification?.verified),
        validation_message: 'Professional references',
        details: referencesVerification?.verified ? {
          issuer: referencesVerification.provider || 'Unknown Provider',
          type: 'Professional References',
          number: `${referencesVerification.count || 0} references`,
          status: referencesVerification.verified ? 'Verified' : 'Not Verified',
          expirationDate: referencesVerification.verificationDate || null,
          boardActions: [],
          hasBoardAction: false
        } : undefined
      };

    default:
      return {
        is_valid: false,
        validation_message: `Unknown requirement type: ${requirement.requirement_type}`,
        details: {
          issuer: 'Unknown',
          type: requirement.requirement_type || 'Unknown',
          number: 'Not Available',
          status: 'Unknown',
          expirationDate: null,
          boardActions: [],
          hasBoardAction: false
        }
      };
  }
}; 