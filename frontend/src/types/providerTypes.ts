export interface Requirements {
  stateLicense: boolean;
  deaCds: boolean;
  boardCertification: boolean;
  degree: boolean;
  residency: boolean;
  malpracticeInsurance: boolean;
  backgroundCheck: boolean;
  workHistory: boolean;
}

export interface ProviderType {
  id: string;
  name: string;
  requirements: Requirements;
}

export interface License {
  code: string;
  number: string;
  state: string;
  category?: string;
  status?: string;
  type?: string;
  source?: string;
  issuer?: string;
  expirationDate?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
}

export interface NPIValidationResponse {
  'NPI Validation': {
    providerName: string;
    npi: string;
    updateDate: string;
    licenses: License[];
  };
  Licenses: License[];
  rawApiResponse: any; // Keep this for backward compatibility
} 