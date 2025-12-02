// Backend API format
export interface ValidationRules {
  must_be_valid?: boolean;
  must_be_active?: boolean;
  must_be_unrestricted?: boolean;
  identifier_type?: string;
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

// Metadata for requirements
export interface RequirementMetadata {
  requirement_type: string;
  name: string;
  description: string;
  validation_rules: ValidationRules;
  base_requirement_id: number;
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
  cprCertification: boolean;
  [key: string]: boolean;
}

// Backend provider type with requirements as boolean flags
export interface BackendProviderType {
  id: string;
  name: string;
  code: string;
  requirements: FrontendRequirements;
  base_requirements?: BaseRequirement[];
}

// Frontend provider type with boolean flags
export interface FrontendProviderType {
  id: string;
  name: string;
  requirements: FrontendRequirements;
}

// Mapping between requirement types and frontend keys
export const requirementTypeToUIKey: {
  [key: string]: keyof FrontendRequirements;
} = {
  identifier: "nationalProviderId",
  license: "stateLicense",
  certification: "boardCertification",
  cpr_certification: "cprCertification",
  background_check: "backgroundCheck",
  immunization: "immunizationRecords",
  professional_references: "professionalReferences",
  continuing_education: "continuingEducation",
  insurance: "malpracticeInsurance",
  registration: "deaRegistration",
  degree: "medicalDegree",
  residency: "residency",
  work_history: "workHistory",
};

// Base requirement IDs from database
export const BASE_REQUIREMENT_IDS = {
  nationalProviderId: 8,
  stateLicense: 1,
  boardCertification: 2,
  backgroundCheck: 3,
  immunizationRecords: 4,
  professionalReferences: 5,
  continuingEducation: 6,
  malpracticeInsurance: 7,
  deaRegistration: 9,
  medicalDegree: 11,
  residency: 13,
  workHistory: 14,
} as const;

// Frontend UI format
export type RequirementsUI = FrontendRequirements;

export interface ProviderTypeUI {
  id: string;
  name: string;
  requirements: RequirementsUI;
}

// Requirement Categories for UI organization
export const requirementCategories = {
  identification: ["nationalProviderId"],
  education: ["medicalDegree", "residency", "continuingEducation"],
  licensing: ["stateLicense", "boardCertification", "deaRegistration"],
  verification: ["backgroundCheck", "workHistory", "professionalReferences"],
  compliance: ["immunizationRecords", "malpracticeInsurance"],
} as const;

export type RequirementCategory = keyof typeof requirementCategories;

// Default validation rules for each requirement type
export const defaultValidationRules: { [key: string]: ValidationRules } = {
  nationalProviderId: {
    must_be_verified: true,
  },
  stateLicense: {
    must_be_active: true,
    must_be_unrestricted: true,
  },
  boardCertification: {
    must_be_active: true,
  },
  backgroundCheck: {
    must_be_completed: true,
  },
  immunizationRecords: {
    must_be_up_to_date: true,
  },
  professionalReferences: {
    must_be_verified: true,
  },
  continuingEducation: {
    must_be_completed: true,
  },
  malpracticeInsurance: {
    must_be_active: true,
  },
  deaRegistration: {
    must_be_active: true,
  },
  medicalDegree: {
    must_be_verified: true,
  },
  residency: {
    must_be_completed: true,
  },
  workHistory: {
    must_be_verified: true,
    verification_period_years: 5,
  },
};

// Utility function to generate code from name
export function generateProviderTypeCode(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_") // Replace non-alphanumeric with underscore
    .replace(/^_+|_+$/g, ""); // Remove leading/trailing underscores
}
