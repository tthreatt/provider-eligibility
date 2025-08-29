export interface ValidationRule {
  must_be_active?: boolean;
  must_be_unrestricted?: boolean;
  must_be_completed?: boolean;
  must_be_verified?: boolean;
  must_be_enrolled?: boolean;
  must_be_up_to_date?: boolean;
  license_type?: string;
  registration_type?: string;
  certification_type?: string;
  degree_type?: string;
  verification_period_years?: number;
  [key: string]: any;
}

export interface BaseRequirement {
  id: number;
  requirement_type: string;
  name: string;
  description: string;
  validation_rules: ValidationRule;
}

export interface ValidationDetail {
  issuer?: string;
  type?: string;
  number?: string;
  status?: string;
  expirationDate?: string | null;
  boardActions?: string[];
  hasBoardAction?: boolean;
  additionalInfo?: {
    deaSchedules?: string;
    licenseState?: string;
  };
  details?: {
    issuer?: string;
    type?: string;
    number?: string;
    status?: string;
    expirationDate?: string | null;
    boardActions?: string[];
    hasBoardAction?: boolean;
    additionalInfo?: {
      deaSchedules?: string;
      licenseState?: string;
    };
  };
}

export interface Requirement {
  id: number;
  requirement_type: string;
  type: string;
  name: string;
  description: string;
  validation_rules: ValidationRule;
  is_required: boolean;
  is_valid: boolean;
  validation_message?: string;
  status: 'valid' | 'invalid' | 'required' | 'optional';
  details: ValidationDetail[];
  base_requirement_id: number;
  provider_type_id: number;
  severity: number;
}

export interface ProviderType {
  id: number;
  code: string;
  name: string;
  requirements: Requirement[];
}

export interface License {
  category?: string;
  status?: string;
  number?: string;
  type?: string;
  issuer?: string;
  expirationDate?: string;
  code?: string;
  state?: string;
  firstName?: string;
  lastName?: string;
  hasBoardAction?: boolean;
  issueDate?: string;
  origin?: string;
  primarySourceCheckedDate?: string;
  primarySourceLastVerifiedDate?: string;
  screenshotId?: string;
  source?: string;
  boardActions?: string[];
  additionalInfo?: {
    deaSchedules?: string;
    licenseState?: string;
    mocStatus?: string;
    renewalDate?: string;
    durationType?: string;
    reverificationDate?: string;
  };
}

export interface NPIValidation {
  npiDetails: {
    providerName: string;
    npi: string;
    updateDate: string;
    providerType?: string;
    Code?: string;
    licenses?: Array<License>;
    entityType?: string;
    enumerationDate?: string;
    gender?: string;
  };
  providerName?: string;
  npi?: string;
  updateDate?: string;
  providerType?: string;
  licenses?: Array<License>;
  entityType?: string;
  enumerationDate?: string;
  rawApiResponse?: any;
}

export interface ProcessedEligibility {
  isEligible: boolean;
  requirements: Requirement[];
  rawValidation: NPIValidation;
  providerType?: string;
  validationMessages?: string[];
}