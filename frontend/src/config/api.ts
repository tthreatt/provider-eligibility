export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Add some logging to debug the URL being used
console.log('API Base URL:', API_BASE_URL);

export const API_ROUTES = {
  ELIGIBILITY_RULES: `${API_BASE_URL}/api/eligibility/rules`,
  ELIGIBILITY_CHECK: `${API_BASE_URL}/api/eligibility/check`,
  BASE_REQUIREMENTS: `${API_BASE_URL}/api/eligibility/base-requirements`,
};

export async function fetchBaseRequirements() {
  const response = await fetch(API_ROUTES.BASE_REQUIREMENTS);
  if (!response.ok) {
    throw new Error('Failed to fetch base requirements');
  }
  return response.json();
}

export async function fetchProviderRules() {
  const response = await fetch(API_ROUTES.ELIGIBILITY_RULES);
  if (!response.ok) {
    throw new Error('Failed to fetch provider rules');
  }
  return response.json();
}

export async function updateProviderRule(id: string, data: any) {
  const response = await fetch(`${API_ROUTES.ELIGIBILITY_RULES}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update provider rule');
  }
  return response.json();
}

export async function deleteProviderRule(id: string) {
  const response = await fetch(`${API_ROUTES.ELIGIBILITY_RULES}/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete provider rule');
  }
  return response.json();
} 