// Use Next.js API routes instead of calling backend directly
// This ensures proper authentication and works in production
export const API_ROUTES = {
  ELIGIBILITY_RULES: '/api/eligibility/rules',
  ELIGIBILITY_CHECK: '/api/eligibility/check',
  BASE_REQUIREMENTS: '/api/eligibility/base-requirements',
};

export async function fetchBaseRequirements() {
  const response = await fetch(API_ROUTES.BASE_REQUIREMENTS, {
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch base requirements');
  }
  return response.json();
}

export async function fetchProviderRules() {
  const response = await fetch(API_ROUTES.ELIGIBILITY_RULES, {
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch provider rules');
  }
  return response.json();
}

export async function updateProviderRule(id: string, data: any) {
  const response = await fetch(`${API_ROUTES.ELIGIBILITY_RULES}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update provider rule');
  }
  return response.json();
}

export async function deleteProviderRule(id: string) {
  const response = await fetch(`${API_ROUTES.ELIGIBILITY_RULES}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete provider rule');
  }
  return response.json();
} 