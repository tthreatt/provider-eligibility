import { 
  defaultValidationRules,
  requirementTypeToUIKey
} from '@/types/providerTypes';

import type { 
  BackendProviderType, 
  BaseRequirement, 
  RequirementMetadata,
} from '@/types/providerTypes';

const API_BASE_URL = 'http://localhost:8000/api/eligibility';

export async function getProviderTypes(): Promise<BackendProviderType[]> {
  const response = await fetch(`${API_BASE_URL}/rules`);
  if (!response.ok) {
    throw new Error('Failed to fetch provider types');
  }
  return response.json();
}

export async function getBaseRequirements(): Promise<BaseRequirement[]> {
  const response = await fetch(`${API_BASE_URL}/base-requirements`);
  if (!response.ok) {
    throw new Error('Failed to fetch base requirements');
  }
  return response.json();
}

export async function createProviderType(providerType: Omit<BackendProviderType, 'id'>): Promise<BackendProviderType> {
  const response = await fetch(`${API_BASE_URL}/rules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(providerType),
  });
  if (!response.ok) {
    throw new Error('Failed to create provider type');
  }
  return response.json();
}

export async function updateProviderType(id: number, providerType: Omit<BackendProviderType, 'id'>): Promise<BackendProviderType> {
  const response = await fetch(`${API_BASE_URL}/rules/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(providerType),
  });
  if (!response.ok) {
    throw new Error('Failed to update provider type');
  }
  return response.json();
}

export async function deleteProviderType(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/rules/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete provider type');
  }
} 