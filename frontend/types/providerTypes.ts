export interface RequirementRule {
  requirement_type: string;
  name: string;
  description: string;
  is_required: boolean;
  validation_rules: {
    must_be_active?: boolean;
    must_be_accredited?: boolean;
    must_be_unrestricted?: boolean;
    must_be_completed?: boolean;
    must_be_valid?: boolean;
    must_be_current?: boolean;
    must_be_verified?: boolean;
    verification_period_years?: number;
    minimum_references?: number;
    degree_types?: string[];
    license_type?: string;
    certification_type?: string;
    registration_type?: string;
    insurance_type?: string;
    identifier_type?: string;
    [key: string]: any;
  };
}

export interface ProviderType {
  id: number;
  code: string;
  name: string;
  requirements: RequirementRule[];
}
