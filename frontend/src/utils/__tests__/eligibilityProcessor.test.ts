import { validateRequirement, processEligibilityData } from '../eligibilityProcessor';

describe('NPI Validation', () => {
  const mockNPIRule = {
    requirement_type: 'npi',
    name: 'National Provider Identifier',
    description: 'Valid NPI number',
    is_required: true,
    validation_rules: {
      required: true,
      format: 'number',
      length: 10
    }
  };

  const mockProviderData = {
    rawApiResponse: {
      'NPI Validation': {
        npi: '1669437901',
        providerName: 'DENNIS L. COSGROVE O.D.',
        updateDate: '2007-07-30',
        entityType: 'Individual',
        enumerationDate: '2007-07-30',
        status: 'Active'
      },
      'Licenses': []
    }
  };

  it('should validate NPI when present and active in NPI Validation section', () => {
    const result = validateRequirement(mockNPIRule, mockProviderData);
    expect(result.is_valid).toBe(true);
    expect(result.status).toBe('valid');
    expect(result.verification_status).toBe('verified');
    expect(result.details?.[0]?.status).toBe('Active');
  });

  it('should mark NPI as invalid when missing', () => {
    const invalidData = {
      rawApiResponse: {
        'NPI Validation': {
          providerName: 'DENNIS L. COSGROVE O.D.',
          updateDate: '2007-07-30'
        },
        'Licenses': []
      }
    };
    const result = validateRequirement(mockNPIRule, invalidData);
    expect(result.is_valid).toBe(false);
    expect(result.status).toBe('required');
    expect(result.verification_status).toBe('pending');
  });

  it('should mark NPI as invalid when inactive', () => {
    const inactiveData = {
      ...mockProviderData,
      rawApiResponse: {
        ...mockProviderData.rawApiResponse,
        'NPI Validation': {
          ...mockProviderData.rawApiResponse['NPI Validation'],
          status: 'Inactive'
        }
      }
    };
    const result = validateRequirement(mockNPIRule, inactiveData);
    expect(result.is_valid).toBe(false);
    expect(result.status).toBe('invalid');
    expect(result.verification_status).toBe('failed');
  });

  it('should process NPI in overall eligibility check', () => {
    const result = processEligibilityData(mockProviderData);
    const npiRequirement = result.requirements.find(r => 
      r.requirement_type.toLowerCase() === 'npi' || 
      r.requirement_type.toLowerCase() === 'national_provider_identifier'
    );
    expect(npiRequirement).toBeDefined();
    expect(npiRequirement?.is_valid).toBe(true);
    expect(npiRequirement?.status).toBe('valid');
    expect(npiRequirement?.verification_status).toBe('verified');
  });
}); 