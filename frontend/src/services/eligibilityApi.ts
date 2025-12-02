import {
  defaultValidationRules,
  requirementTypeToUIKey,
} from "@/types/providerTypes";

import type {
  BackendProviderType,
  BaseRequirement,
  RequirementMetadata,
} from "@/types/providerTypes";

// Use Next.js API routes instead of calling backend directly
const API_BASE = "/api/eligibility";

export async function getProviderTypes(): Promise<BackendProviderType[]> {
  const response = await fetch(`${API_BASE}/rules`, {
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch provider types");
  }
  return response.json();
}

export async function getBaseRequirements(): Promise<BaseRequirement[]> {
  const response = await fetch(`${API_BASE}/base-requirements`, {
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch base requirements");
  }
  return response.json();
}

export async function createProviderType(
  providerType: Omit<BackendProviderType, "id">
): Promise<BackendProviderType> {
  const response = await fetch(`${API_BASE}/rules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(providerType),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create provider type");
  }
  return response.json();
}

export async function updateProviderType(
  id: number,
  providerType: Omit<BackendProviderType, "id">
): Promise<BackendProviderType> {
  const response = await fetch(`${API_BASE}/rules/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(providerType),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update provider type");
  }
  return response.json();
}

export async function deleteProviderType(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/rules/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete provider type");
  }
}
