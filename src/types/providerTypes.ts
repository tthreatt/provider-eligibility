// Validation rules for requirements
export interface ValidationRules {
  must_be_valid?: boolean;
  must_be_active?: boolean;
  must_be_unrestricted?: boolean;
  must_be_completed?: boolean;
  must_be_verified?: boolean;
  must_be_up_to_date?: boolean;
  must_be_accredited?: boolean;
  verification_period_years?: number;
  minimum_references?: number;
  identifier_type?: string;
  license_type?: string;
  certification_type?: string;
  registration_type?: string;
  insurance_type?: string;
  [key: string]: any;
}

// Base requirement from the database
export interface BaseRequirement {
  id: number;
  requirement_type: string;
  name: string;
  description: string;
  validation_rules: ValidationRules;
}

// Backend requirement format
export interface BackendRequirement {
  requirement_type: string;
  name: string;
  description: string;
  is_required: boolean;
  validation_rules: ValidationRules;
  base_requirement_id: number;
  provider_type_id?: number;
  id?: number;
}

// Frontend boolean flags for requirements
export interface FrontendRequirements {
  nationalProviderId: boolean;
  stateLicense: boolean;
  boardCertification: boolean;
  backgroundCheck: boolean;
  immunizationRecords: boolean;
  professionalReferences: boolean;
  continuingEducation: boolean;
  malpracticeInsurance: boolean;
  deaRegistration: boolean;
  medicalDegree: boolean;
  residency: boolean;
  workHistory: boolean;
  [key: string]: boolean;
}

// Backend provider type with requirements as boolean flags
export interface BackendProviderType {
  id: string;
  name: string;
  code: string;  // Required field
  requirements: FrontendRequirements;
  base_requirements?: BaseRequirement[];
}

// Mapping between requirement types and frontend keys
export const requirementTypeToUIKey: { [key: string]: keyof FrontendRequirements } = {
  'identifier': 'nationalProviderId',
  'license': 'stateLicense',
  'certification': 'boardCertification',
  'background_check': 'backgroundCheck',
  'immunization': 'immunizationRecords',
  'professional_references': 'professionalReferences',
  'continuing_education': 'continuingEducation',
  'insurance': 'malpracticeInsurance',
  'registration': 'deaRegistration',
  'degree': 'medicalDegree',
  'residency': 'residency',
  'work_history': 'workHistory'
};

// Mapping from UI keys to requirement metadata
export const requirementMetadata: Record<keyof FrontendRequirements, {
  requirement_type: string;
  name: string;
  description: string;
  validation_rules: ValidationRules;
  base_requirement_id: number;
}> = {
  nationalProviderId: {
    requirement_type: 'identifier',
    name: 'National Provider Identifier',
    description: 'Valid NPI number',
    validation_rules: {
      must_be_valid: true,
      identifier_type: 'npi'
    },
    base_requirement_id: 8
  },
  stateLicense: {
    requirement_type: 'license',
    name: 'State License',
    description: 'Current, unrestricted state license',
    validation_rules: {
      must_be_active: true,
      must_be_unrestricted: true,
      license_type: 'state_medical'
    },
    base_requirement_id: 1
  },
  boardCertification: {
    requirement_type: 'certification',
    name: 'Board Certification',
    description: 'Board certification in specialty',
    validation_rules: {
      must_be_active: true,
      certification_type: 'board_certification'
    },
    base_requirement_id: 2
  },
  backgroundCheck: {
    requirement_type: 'background_check',
    name: 'Background Check',
    description: 'Completed background check',
    validation_rules: {
      must_be_completed: true
    },
    base_requirement_id: 3
  },
  immunizationRecords: {
    requirement_type: 'immunization',
    name: 'Immunization Records',
    description: 'Up-to-date immunization records',
    validation_rules: {
      must_be_up_to_date: true
    },
    base_requirement_id: 4
  },
  professionalReferences: {
    requirement_type: 'professional_references',
    name: 'Professional References',
    description: 'Verified professional references',
    validation_rules: {
      must_be_verified: true,
      minimum_references: 3
    },
    base_requirement_id: 5
  },
  continuingEducation: {
    requirement_type: 'continuing_education',
    name: 'Continuing Education',
    description: 'Completed continuing education requirements',
    validation_rules: {
      must_be_completed: true
    },
    base_requirement_id: 6
  },
  malpracticeInsurance: {
    requirement_type: 'insurance',
    name: 'Malpractice Insurance',
    description: 'Active malpractice insurance',
    validation_rules: {
      must_be_active: true,
      insurance_type: 'malpractice'
    },
    base_requirement_id: 7
  },
  deaRegistration: {
    requirement_type: 'registration',
    name: 'DEA Registration',
    description: 'Current DEA registration',
    validation_rules: {
      must_be_active: true,
      registration_type: 'dea'
    },
    base_requirement_id: 9
  },
  medicalDegree: {
    requirement_type: 'degree',
    name: 'Medical Degree',
    description: 'Medical degree verification',
    validation_rules: {
      must_be_verified: true,
      must_be_accredited: true
    },
    base_requirement_id: 11
  },
  residency: {
    requirement_type: 'residency',
    name: 'Residency',
    description: 'Completed residency program',
    validation_rules: {
      must_be_completed: true
    },
    base_requirement_id: 13
  },
  workHistory: {
    requirement_type: 'work_history',
    name: 'Work History',
    description: 'Verified work history',
    validation_rules: {
      must_be_verified: true,
      verification_period_years: 5
    },
    base_requirement_id: 14
  }
}; 