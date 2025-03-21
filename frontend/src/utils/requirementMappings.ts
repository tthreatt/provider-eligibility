export interface RequirementMetadata {
  requirement_type: string;
  name: string;
  description: string;
  validation_rules: Record<string, any>;
  base_requirement_id: number;
}

export const requirementMetadata: Record<string, RequirementMetadata> = {
  npi: {
    name: "National Provider Identifier",
    requirement_type: "identifier",
    description: "Valid NPI number",
    validation_rules: {
      identifier_type: "npi"
    }
  },
  stateLicense: {
    name: "State License",
    requirement_type: "license",
    description: "Current, unrestricted state license",
    validation_rules: {}
  },
  boardCertification: {
    name: "Board Certification",
    requirement_type: "certification",
    description: "Board certification in specialty",
    validation_rules: {
      certification_type: "board_certification"
    }
  },
  backgroundCheck: {
    name: "Background Check",
    requirement_type: "background_check",
    description: "Completed background check",
    validation_rules: {}
  },
  immunization: {
    name: "Immunization Records",
    requirement_type: "immunization",
    description: "Up-to-date immunization records",
    validation_rules: {}
  },
  professionalReferences: {
    name: "Professional References",
    requirement_type: "professional_references",
    description: "Verified professional references",
    validation_rules: {}
  },
  continuingEducation: {
    name: "Continuing Education",
    requirement_type: "continuing_education",
    description: "Completed continuing education requirements",
    validation_rules: {}
  },
  malpracticeInsurance: {
    name: "Malpractice Insurance",
    requirement_type: "insurance",
    description: "Active malpractice insurance",
    validation_rules: {}
  },
  deaRegistration: {
    requirement_type: "registration",
    name: "DEA Registration",
    description: "Current DEA registration",
    validation_rules: {
      must_be_active: true,
      registration_type: "dea"
    },
    base_requirement_id: 9
  },
  medicalDegree: {
    requirement_type: "degree",
    name: "Medical Degree",
    description: "Medical degree verification",
    validation_rules: {
      must_be_verified: true,
      must_be_accredited: true
    },
    base_requirement_id: 11
  },
  residency: {
    requirement_type: "residency",
    name: "Residency",
    description: "Completed residency program",
    validation_rules: {
      must_be_completed: true
    },
    base_requirement_id: 13
  },
  workHistory: {
    requirement_type: "work_history",
    name: "Work History",
    description: "Verified work history",
    validation_rules: {
      must_be_verified: true,
      verification_period_years: 5
    },
    base_requirement_id: 14
  }
}; 