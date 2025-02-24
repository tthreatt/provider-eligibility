export interface ProviderType {
  id: string;
  name: string;
  requirements: {
    stateLicense: boolean;
    deaCds: boolean;
    boardCertification: boolean;
  };
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