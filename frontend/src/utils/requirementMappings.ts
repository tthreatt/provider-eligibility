export interface RequirementMetadata {
  requirement_type: string;
  name: string;
  description: string;
  validation_rules: Record<string, any>;
}

export const requirementMetadata: Record<string, RequirementMetadata> = {
  stateLicense: {
    requirement_type: "license",
    name: "State License",
    description: "Current, unrestricted state license",
    validation_rules: {
      must_be_active: true,
      must_be_unrestricted: true,
      license_type: "state_medical"
    }
  },
  deaCds: {
    requirement_type: "registration",
    name: "DEA Registration",
    description: "Current DEA registration",
    validation_rules: {
      must_be_active: true,
      registration_type: "dea"
    }
  },
  boardCertification: {
    requirement_type: "certification",
    name: "Board Certification",
    description: "Board certification in specialty",
    validation_rules: {
      must_be_active: true,
      certification_type: "board_certification"
    }
  },
  degree: {
    requirement_type: "degree",
    name: "Medical Degree",
    description: "Medical degree verification",
    validation_rules: {
      must_be_active: true,
      must_be_accredited: true
    }
  },
  residency: {
    requirement_type: "residency",
    name: "Residency",
    description: "Completed residency program",
    validation_rules: {
      must_be_completed: true
    }
  },
  malpracticeInsurance: {
    requirement_type: "insurance",
    name: "Malpractice Insurance",
    description: "Active malpractice insurance",
    validation_rules: {
      must_be_active: true,
      insurance_type: "malpractice"
    }
  },
  backgroundCheck: {
    requirement_type: "background_check",
    name: "Background Check",
    description: "Completed background check",
    validation_rules: {
      must_be_completed: true
    }
  },
  workHistory: {
    requirement_type: "work_history",
    name: "Work History",
    description: "Verified work history",
    validation_rules: {
      must_be_verified: true
    }
  }
}; 