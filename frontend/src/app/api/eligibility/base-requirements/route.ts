import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    // Get the auth session
    let userId;
    try {
      const authResult = await auth();
      userId = authResult?.userId;
    } catch (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        {
          error: "Authentication error",
          details: authError instanceof Error ? authError.message : "Failed to authenticate",
        },
        { status: 500 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "No user session found",
        },
        { status: 401 }
      );
    }

    // Validate BACKEND_URL
    if (!BACKEND_URL || BACKEND_URL === "http://localhost:8000") {
      console.warn("BACKEND_URL not configured, using default");
    }

    // Call your FastAPI backend
    let response;
    try {
      response = await fetch(
      `${BACKEND_URL}/api/eligibility/base-requirements`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": process.env.API_KEY || "",
        },
      }
    );
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        {
          error: "Failed to connect to backend",
          details: fetchError instanceof Error ? fetchError.message : "Network error",
        },
        { status: 503 }
      );
    }

    if (!response.ok) {
      let errorData: any = {};
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            errorData = await response.json();
          } catch (jsonError) {
            // Response claims to be JSON but parsing failed - read as text instead
            const text = await response.text();
            errorData = { error: text || "Failed to fetch base requirements" };
            console.warn("Failed to parse error response as JSON, using text:", text.substring(0, 200));
          }
        } else {
          const text = await response.text();
          errorData = { error: text || "Failed to fetch base requirements" };
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
        errorData = { error: "Failed to fetch base requirements" };
      }
      return NextResponse.json(
        { error: errorData.error || errorData.detail || "Failed to fetch base requirements" },
        { status: response.status }
      );
    }

    let baseRequirements;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          baseRequirements = await response.json();
        } catch (jsonError) {
          // Response claims to be JSON but parsing failed - read as text to get error details
          const text = await response.text();
          console.error("Failed to parse JSON response:", jsonError);
          console.error("Response body:", text.substring(0, 500));
          throw new Error(`Invalid JSON response: ${jsonError instanceof Error ? jsonError.message : "Unknown error"}. Response: ${text.substring(0, 200)}`);
        }
      } else {
        const text = await response.text();
        throw new Error(`Unexpected content type: ${contentType}. Response: ${text.substring(0, 200)}`);
      }
    } catch (parseError) {
      console.error("Error parsing base requirements response:", parseError);
      throw new Error(`Failed to parse response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
    }
    
    return NextResponse.json(baseRequirements);
  } catch (error) {
    console.error("Base requirements error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
