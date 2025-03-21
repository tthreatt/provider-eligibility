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

export interface Requirement extends BaseRequirement {
  is_required: boolean;
  base_requirement_id: number;
  provider_type_id: number;
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
}

export interface Requirement {
  requirement_type: string;
  name: string;
  description: string;
  is_required: boolean;
  is_valid: boolean;
  validation_message?: string;
  validation_rules: Record<string, any>;
  details?: {
    issuer?: string;
    number?: string;
    expirationDate?: string;
    status?: string;
  };
  base_requirement_id: number;
  provider_type_id: number;
  id: number;
  severity: number;
}

export interface ProcessedEligibility {
  isEligible: boolean;
  requirements: Requirement[];
  rawValidation: NPIValidation;
  providerType?: string;
} 