/** Requirements for a healthcare provider */
export interface Requirement {
  /** Whether a state license is required */
  stateLicense: boolean
  /** Whether controlled substance registration is required */
  deaCds: boolean
  /** Whether board certification is required */
  boardCertification: boolean
}

export interface ProviderType {
  id: string
  name: string
  requirements: Requirement
}

