import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server'
import { providerTypes } from '@/config/providerRules';

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
    const processedData = processApiResponse(data);
    return NextResponse.json(processedData);

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

// Helper functions to process Provider Trust API response
function checkStateLicense(data: any): boolean {
  // Access the correct level of the response
  const licenses = data?.rawApiResponse?.Licenses || [];
  console.log('All licenses:', licenses);
  console.log('Checking state licenses:', licenses.filter(l => l.category?.toLowerCase() === 'state_license'));
  
  const hasActiveLicense = licenses.some((license: any) => {
    const isStateCategory = license.category?.toLowerCase() === 'state_license';
    const isActive = license.status?.toLowerCase() === 'active';
    const isNotExpired = new Date(license.expirationDate) > new Date();
    
    console.log('License check:', {
      license,
      isStateCategory,
      isActive,
      isNotExpired,
      expirationDate: license.expirationDate,
      currentDate: new Date()
    });
    
    return isStateCategory && isActive && isNotExpired;
  });

  console.log('State License Check:', { 
    hasActiveLicense, 
    activeLicenses: licenses.filter(l => {
      const isStateCategory = l.category?.toLowerCase() === 'state_license';
      const isActive = l.status?.toLowerCase() === 'active';
      const isNotExpired = new Date(l.expirationDate) > new Date();
      return isStateCategory && isActive && isNotExpired;
    }).map(l => ({
      category: l.category,
      issuer: l.issuer,
      type: l.type,
      number: l.number,
      status: l.status,
      expirationDate: l.expirationDate
    }))
  });
  return hasActiveLicense;
}

function checkDeaCds(data: any): boolean {
  const licenses = data?.rawApiResponse?.Licenses || [];
  
  const hasActiveDea = licenses.some((license: any) => {
    const isDeaCategory = license.category?.toLowerCase() === 'controlled_substance_registration';
    const isActive = license.status?.toLowerCase() === 'active';
    const isNotExpired = new Date(license.expirationDate) > new Date();
    
    return isDeaCategory && isActive && isNotExpired;
  });

  console.log('DEA Check:', { 
    hasActiveDea, 
    deaLicenses: licenses.filter(l => {
      const isDeaCategory = l.category?.toLowerCase() === 'controlled_substance_registration';
      const isActive = l.status?.toLowerCase() === 'active';
      const isNotExpired = new Date(l.expirationDate) > new Date();
      return isDeaCategory && isActive && isNotExpired;
    }).map(l => ({
      category: l.category,
      issuer: l.issuer,
      type: l.type,
      number: l.number,
      status: l.status,
      expirationDate: l.expirationDate
    }))
  });
  return hasActiveDea;
}

function checkBoardCertification(data: any): boolean {
  const licenses = data?.rawApiResponse?.Licenses || [];
  
  const hasActiveCert = licenses.some((license: any) => {
    const isBoardCategory = license.category?.toLowerCase() === 'board_certification';
    const isActive = license.status?.toLowerCase() === 'active';
    const isNotExpired = new Date(license.expirationDate) > new Date();
    
    return isBoardCategory && isActive && isNotExpired;
  });

  console.log('Board Cert Check:', { 
    hasActiveCert, 
    activeCerts: licenses.filter(l => {
      const isBoardCategory = l.category?.toLowerCase() === 'board_certification';
      const isActive = l.status?.toLowerCase() === 'active';
      const isNotExpired = new Date(l.expirationDate) > new Date();
      return isBoardCategory && isActive && isNotExpired;
    }).map(l => ({
      category: l.category,
      issuer: l.issuer,
      type: l.type,
      number: l.number,
      status: l.status,
      expirationDate: l.expirationDate
    }))
  });
  return hasActiveCert;
}

function extractProviderType(data: any): string {
  const npiValidation = data?.rawApiResponse?.['NPI Validation'];
  if (!npiValidation?.licenses?.[0]?.code) {
    return 'Unknown Provider Type';
  }
  
  // The code format is "2084N0402X - Allopathic & Osteopathic Physicians - ..."
  // Split by " - " and get the second part
  const parts = npiValidation.licenses[0].code.split(' - ');
  if (parts.length >= 2) {
    return parts[1];
  }
  
  return 'Unknown Provider Type';
}

function processApiResponse(data: any) {
  const hasStateLicense = checkStateLicense(data);
  const hasDeaCds = checkDeaCds(data);
  const hasBoardCert = checkBoardCertification(data);
  
  const providerType = extractProviderType(data);
  const requirements = providerTypes.find(type => type.name === providerType)?.requirements;
  
  if (!requirements) {
    return {
      isEligible: false,
      requirements: {
        stateLicense: false,
        deaCds: false,
        boardCertification: false,
        providerType
      },
      rawApiResponse: data
    };
  }

  const isEligible = 
    (!requirements.stateLicense || hasStateLicense) &&
    (!requirements.deaCds || hasDeaCds) &&
    (!requirements.boardCertification || hasBoardCert);

  console.log('Final eligibility check:', {
    requirements,
    hasStateLicense,
    hasDeaCds,
    hasBoardCert,
    isEligible
  });

  return {
    isEligible,
    requirements: {
      stateLicense: hasStateLicense,
      deaCds: hasDeaCds,
      boardCertification: hasBoardCert,
      providerType
    },
    rawApiResponse: data
  };
}