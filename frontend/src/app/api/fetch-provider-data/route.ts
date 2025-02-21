import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'
const API_KEY = process.env.API_KEY;

export async function POST(request: Request) {
  try {
    // Get the auth session
    const session = await auth();
    const { userId } = session;

    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: 'No user session found'
      }, { status: 401 });
    }

    // Get the request body
    const body = await request.json();
    const { npi } = body;

    // Call your backend API
    const response = await fetch(`${BACKEND_URL}/api/fetch-provider-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY || '',
      },
      body: JSON.stringify({ npi }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch provider data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

// Helper functions to process Provider Trust API response
function determineEligibility(data: any): boolean {
  const providerType = getProviderType(data);
  const hasStateLicense = checkStateLicense(data);
  const hasDeaCds = checkDeaCds(data);
  const hasBoardCert = checkBoardCertification(data);

  // Get requirements for this provider type
  const requirements = providerTypes.find(type => type.name === providerType)?.requirements;
  
  if (!requirements) return false;

  // Check if all required credentials are present
  return (!requirements.stateLicense || hasStateLicense) &&
         (!requirements.deaCds || hasDeaCds) &&
         (!requirements.boardCertification || hasBoardCert);
}

function checkStateLicense(data: any): boolean {
  const licenses = data.Licenses || [];
  return licenses.some(
    (license: any) =>
      license.status === 'Active' &&
      license.category === 'state_license'
  );
}

function checkDeaCds(data: any): boolean {
  const licenses = data.Licenses || [];
  return licenses.some(
    (license: any) =>
      license.status === 'Active' &&
      license.category === 'controlled_substance_registration'
  );
}

function checkBoardCertification(data: any): boolean {
  const licenses = data.Licenses || [];
  return licenses.some(
    (license: any) =>
      license.status === 'Active' &&
      license.category === 'board_certification'
  );
}

function getProviderType(data: any): string {
  const npiLicenses = data['NPI Validation']?.licenses || [];
  const code = npiLicenses[0]?.code || '';
  
  // Match the pattern " - Provider Type - " and get the middle part
  const match = code.match(/- (.*?) -/);
  return match ? match[1] : '';
}

// Add the provider types from RuleList.tsx
const providerTypes = [
  {
    id: "1",
    name: "Allopathic & Osteopathic Physicians",
    requirements: { stateLicense: true, deaCds: true, boardCertification: true },
  },
  // ... you can add more types if needed
];