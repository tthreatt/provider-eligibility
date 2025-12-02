import type {
  BackendProviderType,
  BackendRequirement,
  FrontendRequirements,
} from "@/types/providerTypes";
import { API_ROUTES } from "@/config/api";
import { requirementMetadata } from "@/utils/requirementMappings";

// Custom error class for validation errors
export class ValidationError extends Error {
  details: string[];

  constructor(message: string, details: string[]) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

/**
 * Generate a code from a provider type name
 */
function generateProviderTypeCode(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function transformToBackendFormat(data: BackendProviderType) {
  // Convert boolean flags to array of requirements
  const requirements = Object.entries(data.requirements)
    .map(([key, isRequired]) => {
      const metadata = requirementMetadata[key];
      if (!metadata) {
        console.warn(`Skipping requirement with missing metadata: ${key}`);
        return null;
      }

      return {
        requirement_type: metadata.requirement_type,
        name: metadata.name,
        description: metadata.description,
        is_required: isRequired,
        validation_rules: metadata.validation_rules,
        base_requirement_id: metadata.base_requirement_id,
      };
    })
    .filter((req): req is BackendRequirement => req !== null);

  // Ensure we have the code field
  const code = data.code || generateProviderTypeCode(data.name);

  return {
    id: data.id,
    name: data.name,
    code,
    requirements,
  };
}

export async function getProviderTypes(): Promise<BackendProviderType[]> {
  const response = await fetch("/api/eligibility/rules", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch provider types");
  }

  return response.json();
}

export async function updateProviderType(
  id: string,
  data: BackendProviderType
): Promise<BackendProviderType> {
  try {
    const transformedData = transformToBackendFormat(data);
    console.log("Transformed data:", transformedData);

    const response = await fetch(`/api/eligibility/rules/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(transformedData),
    });

    // Get response as text first
    const responseText = await response.text();
    console.log("Raw response:", responseText);

    // Try to parse as JSON
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      console.error("Failed to parse response:", responseText);
      throw new Error("Invalid response from server");
    }

    if (!response.ok) {
      // Handle validation errors
      if (response.status === 422 && responseData?.details) {
        const details = Array.isArray(responseData.details)
          ? responseData.details
          : [responseData.details];
        throw new ValidationError("Validation failed", details);
      }

      // Handle other errors
      const errorMessage =
        responseData?.error || "Failed to update provider type";
      console.error("Update error:", {
        status: response.status,
        message: errorMessage,
        data: responseData,
      });
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    console.error("Service error:", error);
    if (error instanceof ValidationError) {
      // Re-throw validation errors as is
      throw error;
    }
    // Wrap other errors
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
}

export async function getProviderTypeById(
  id: string
): Promise<BackendProviderType> {
  try {
    const response = await fetch(`/api/eligibility/rules/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    // Get response as text first
    const responseText = await response.text();
    console.log("Raw response:", responseText);

    // Try to parse as JSON
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      console.error("Failed to parse response:", responseText);
      throw new Error("Invalid response from server");
    }

    if (!response.ok) {
      const errorMessage =
        responseData?.error || "Failed to fetch provider type";
      console.error("Fetch error:", {
        status: response.status,
        message: errorMessage,
        data: responseData,
      });
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    console.error("Service error:", error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
}
