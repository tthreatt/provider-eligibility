import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { providerTypes } from "@/config/providerRules";
import { License } from "@/types/defaultProviderTypes";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const API_KEY = process.env.API_KEY;

export async function POST(request: Request) {
  try {
    // Get the auth session
    const session = await auth();
    const { userId } = session;

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "No user session found",
        },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.json();
    const { npi } = body;

    // Call your backend API
    const response = await fetch(`${BACKEND_URL}/api/fetch-provider-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY || "",
      },
      body: JSON.stringify({ npi }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch provider data" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const processedData = processApiResponse(data);
    return NextResponse.json(processedData);
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

// Add helper function for date checking
const isValidDate = (date: string | undefined): boolean => {
  if (!date) return false;
  const expirationDate = new Date(date);
  return !isNaN(expirationDate.getTime()) && expirationDate > new Date();
};

// Update the license checks
function checkStateLicense(data: any): boolean {
  // Handle nested rawApiResponse structure: rawApiResponse.rawApiResponse.Licenses
  const innerRawApiResponse =
    data?.rawApiResponse?.rawApiResponse || data?.rawApiResponse || {};
  const licenses = innerRawApiResponse.Licenses || [];

  const hasActiveLicense = licenses.some((license: License) => {
    const isStateCategory = license.category?.toLowerCase() === "state_license";
    const isActive = license.status?.toLowerCase() === "active";
    const isNotExpired = isValidDate(license.expirationDate);

    return isStateCategory && isActive && isNotExpired;
  });

  return hasActiveLicense;
}

function checkDeaCds(data: any): boolean {
  // Handle nested rawApiResponse structure: rawApiResponse.rawApiResponse.Licenses
  const innerRawApiResponse =
    data?.rawApiResponse?.rawApiResponse || data?.rawApiResponse || {};
  const licenses = innerRawApiResponse.Licenses || [];

  const hasActiveDea = licenses.some((license: License) => {
    const isDeaCategory =
      license.category?.toLowerCase() === "controlled_substance_registration";
    const isActive = license.status?.toLowerCase() === "active";
    const isNotExpired = isValidDate(license.expirationDate);

    return isDeaCategory && isActive && isNotExpired;
  });

  return hasActiveDea;
}

function checkBoardCertification(data: any): boolean {
  // Handle nested rawApiResponse structure: rawApiResponse.rawApiResponse.Licenses
  const innerRawApiResponse =
    data?.rawApiResponse?.rawApiResponse || data?.rawApiResponse || {};
  const licenses = innerRawApiResponse.Licenses || [];

  const hasActiveCert = licenses.some((license: License) => {
    const isBoardCategory =
      license.category?.toLowerCase() === "board_certification";
    const isActive = license.status?.toLowerCase() === "active";
    const isNotExpired = isValidDate(license.expirationDate);

    return isBoardCategory && isActive && isNotExpired;
  });

  return hasActiveCert;
}

function extractProviderType(data: any): string {
  // Handle nested rawApiResponse structure: rawApiResponse.rawApiResponse['NPI Validation']
  const innerRawApiResponse =
    data?.rawApiResponse?.rawApiResponse || data?.rawApiResponse || {};
  const npiValidation = innerRawApiResponse["NPI Validation"];
  if (!npiValidation?.licenses?.[0]?.code) {
    return "Unknown Provider Type";
  }

  // The code format is "2084N0402X - Allopathic & Osteopathic Physicians - ..."
  // Split by " - " and get the second part
  const parts = npiValidation.licenses[0].code.split(" - ");
  if (parts.length >= 2) {
    return parts[1];
  }

  return "Unknown Provider Type";
}

function processApiResponse(data: any) {
  const hasStateLicense = checkStateLicense(data);
  const hasDeaCds = checkDeaCds(data);
  const hasBoardCert = checkBoardCertification(data);

  const providerType = extractProviderType(data);
  const requirements = providerTypes.find(
    (type) => type.name === providerType
  )?.requirements;

  if (!requirements) {
    return {
      isEligible: false,
      requirements: {
        stateLicense: hasStateLicense,
        deaCds: hasDeaCds,
        boardCertification: hasBoardCert,
        providerType,
      },
      rawApiResponse: data,
    };
  }

  const isEligible =
    (!requirements.stateLicense || hasStateLicense) &&
    (!requirements.deaCds || hasDeaCds) &&
    (!requirements.boardCertification || hasBoardCert);

  return {
    isEligible,
    requirements: {
      stateLicense: hasStateLicense,
      deaCds: hasDeaCds,
      boardCertification: hasBoardCert,
      providerType,
    },
    rawApiResponse: data,
  };
}
