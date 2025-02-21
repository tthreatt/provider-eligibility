/** Requirements for a healthcare provider */
export interface Requirement {
  /** Whether a state license is required */
  state_license: boolean
  /** Whether controlled substance registration is required */
  controlled_substance_registration: boolean
  /** Whether board certification is required */
  board_certification: boolean
}

export interface ProviderType {
  id: string
  name: string
  requirements: Requirement
}

