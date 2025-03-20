// Backend API format
export interface Requirement {
  requirement_type: string;
  name: string;
  description: string;
  is_required: boolean;
  validation_rules: {
    [key: string]: any;
  };
  base_requirement_id?: number;
  provider_type_id?: number;
  id?: number;
}

export interface Requirements {
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
}

export interface BackendProviderType {
  id: string;
  name: string;
  requirements: Requirements;
}

// Frontend UI format
export type RequirementsUI = Requirements;

export interface ProviderTypeUI {
  id: string;
  name: string;
  requirements: RequirementsUI;
}

// Mapping between UI and API formats
export const requirementTypeToUIKey: { [key: string]: keyof RequirementsUI } = {
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