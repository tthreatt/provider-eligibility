const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Add some logging to debug the URL being used
console.log('API Base URL:', API_BASE_URL);

export const API_ROUTES = {
  ELIGIBILITY_RULES: `${API_BASE_URL}/api/eligibility/rules`,
  ELIGIBILITY_CHECK: `${API_BASE_URL}/api/eligibility/check`,
};

export async function fetchProviderRules() {
  const response = await fetch(API_ROUTES.ELIGIBILITY_RULES);
  if (!response.ok) {
    throw new Error('Failed to fetch provider rules');
  }
  const data = await response.json();
  return data;
} 