import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    // Get the auth session
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "No user session found",
        },
        { status: 401 }
      );
    }

    // Call your FastAPI backend
    const response = await fetch(
      `${BACKEND_URL}/api/eligibility/base-requirements`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": process.env.API_KEY || "",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch base requirements" },
        { status: response.status }
      );
    }

    const baseRequirements = await response.json();
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
