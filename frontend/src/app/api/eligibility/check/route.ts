import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Add type declaration for process.env
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BACKEND_URL?: string;
      API_KEY?: string;
    }
  }
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const API_KEY = process.env.API_KEY;

interface License {
  category?: string;
  status?: string;
  number?: string;
  type?: string;
  issuer?: string;
  expirationDate?: string;
}

interface NPIValidation {
  providerName: string;
  npi: string;
  updateDate: string;
  providerType?: string;
  licenses?: Array<{
    code: string;
    number: string;
    state: string;
  }>;
}

interface EligibilityRequest {
  npi: string;
}

interface EligibilityResponse {
  isEligible: boolean;
  requirements: Array<{
    requirement_type: string;
    name: string;
    description: string;
    is_required: boolean;
    is_valid: boolean;
    validation_message?: string;
    validation_rules: Record<string, any>;
  }>;
  rawApiResponse: {
    'NPI Validation': NPIValidation;
    Licenses: License[];
  };
}

interface ErrorResponse {
  error: string;
  details?: string;
}

// Add new interfaces for the NPI search
interface NPISearchResponse {
  'NPI Validation': NPIValidation;
  Licenses: License[];
  // add other fields as needed
}

interface EligibilityRule {
  id: number;
  code: string;
  name: string;
  requirements: Array<{
    requirement_type: string;
    name: string;
    description: string;
    is_required: boolean;
    validation_rules: Record<string, any>;
  }>;
}

export async function POST(request: Request): Promise<NextResponse<EligibilityResponse | ErrorResponse>> {
  try {
    // Get the auth session
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: 'No user session found'
      }, { status: 401 });
    }

    const { npi } = await request.json();
    
    // 1. Get provider profile
    const profileResponse = await fetch(`${BACKEND_URL}/api/search/instant/npi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY || '',
      },
      body: JSON.stringify({ npi }),
    });

    if (!profileResponse.ok) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch provider profile' },
        { status: profileResponse.status }
      );
    }

    const providerData = await profileResponse.json();
    
    // 2. Get eligibility rules
    const rulesResponse = await fetch(`${BACKEND_URL}/api/eligibility/rules`, {
      method: 'GET',
      headers: {
        'X-API-KEY': API_KEY || '',
      },
    });

    if (!rulesResponse.ok) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch eligibility rules' },
        { status: rulesResponse.status }
      );
    }

    const rules = await rulesResponse.json();

    // Transform the data to match EligibilityResponse interface
    const eligibilityResult: EligibilityResponse = {
      isEligible: true, // You'll want to calculate this based on rules
      requirements: rules.requirements || [],
      rawApiResponse: providerData
    };

    return NextResponse.json<EligibilityResponse>(eligibilityResult);

  } catch (error) {
    console.error('Eligibility check error:', error);
    return NextResponse.json<ErrorResponse>(
      { 
        error: 'Internal Server Error', 
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

function validateRequirement(rule: EligibilityRule['requirements'][0], providerData: NPISearchResponse): boolean {
  const licenses = providerData.Licenses || [];
  
  switch (rule.requirement_type) {
    case 'license':
      return licenses.some(l => 
        l.category?.toLowerCase() === 'state_license' && 
        l.status?.toLowerCase() === 'active'
      );
    
    case 'registration':
      return licenses.some(l => 
        l.category?.toLowerCase() === 'controlled_substance_registration' && 
        l.status?.toLowerCase() === 'active'
      );
    
    case 'certification':
      return licenses.some(l => 
        l.category?.toLowerCase() === 'board_certification' && 
        l.status?.toLowerCase() === 'active'
      );
    
    default:
      return false;
  }
}

function getValidationMessage(
  rule: EligibilityRule['requirements'][0], 
  isValid: boolean, 
  providerData: NPISearchResponse
): string {
  const licenses = providerData.Licenses || [];
  
  if (isValid) {
    const matchingLicense = licenses.find(l => {
      switch (rule.requirement_type) {
        case 'license':
          return l.category?.toLowerCase() === 'state_license' && l.status?.toLowerCase() === 'active';
        case 'registration':
          return l.category?.toLowerCase() === 'controlled_substance_registration' && l.status?.toLowerCase() === 'active';
        case 'certification':
          return l.category?.toLowerCase() === 'board_certification' && l.status?.toLowerCase() === 'active';
        default:
          return false;
      }
    });

    return matchingLicense 
      ? `${matchingLicense.number} (${matchingLicense.issuer}, Expires: ${matchingLicense.expirationDate})`
      : 'Requirement met';
  }

  return `No active ${rule.name.toLowerCase()} found`;
} 