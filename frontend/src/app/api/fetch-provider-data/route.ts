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
    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}/api/fetch-provider-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": API_KEY || "",
        },
        body: JSON.stringify({ npi }),
      });
    } catch (fetchError: any) {
      console.error("Network error calling backend:", {
        error: fetchError,
        message: fetchError?.message,
        stack: fetchError?.stack,
        backendUrl: BACKEND_URL,
      });
      return NextResponse.json(
        { 
          error: "Failed to connect to backend",
          details: fetchError?.message || String(fetchError)
        },
        { status: 503 }
      );
    }

    console.log("Backend response status:", response.status);
    console.log("Backend response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // Read response as text first to avoid consuming the body
      const responseText = await response.text();
      console.log("Backend error response body (first 1000 chars):", responseText.substring(0, 1000));
      
      let errorData: any = {};
      try {
        const contentType = response.headers.get("content-type");
        console.log("Response content-type:", contentType);
        
        if (contentType && contentType.includes("application/json")) {
          try {
            errorData = JSON.parse(responseText);
            console.log("Parsed error JSON:", errorData);
          } catch (jsonError) {
            // Response claims to be JSON but parsing failed - use text instead
            console.warn("Failed to parse error response as JSON:", jsonError);
            errorData = { error: responseText || "Failed to fetch provider data" };
          }
        } else {
          errorData = { error: responseText || "Failed to fetch provider data" };
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
        errorData = { error: responseText || "Failed to fetch provider data" };
      }
      
      // FastAPI uses 'detail' field, but also check for 'error' and 'message'
      const errorMessage = 
        errorData.detail || 
        errorData.error || 
        errorData.message || 
        "Failed to fetch provider data";
      
      console.error("Backend error response:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorMessage,
        rawResponse: responseText.substring(0, 1000),
      });
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorData.details || errorData.error || responseText.substring(0, 500) || undefined
        },
        { status: response.status }
      );
    }

    // For successful responses, parse as JSON
    const data = await response.json();
    const processedData = processApiResponse(data);
    return NextResponse.json(processedData);
  } catch (error: any) {
    console.error("API Route Error in fetch-provider-data:", {
      error,
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        details: error?.message || String(error) || "Unknown error occurred"
      },
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
