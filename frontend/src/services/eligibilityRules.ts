import type { BackendProviderType } from '@/types/providerTypes';
import { API_ROUTES } from '@/config/api';
import { transformToBackendFormat } from '@/utils/transformProviderType';

export async function getProviderTypes(): Promise<BackendProviderType[]> {
  const response = await fetch('/api/eligibility/rules', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch provider types');
  }

  return response.json();
}

export async function updateProviderType(id: string, data: BackendProviderType): Promise<BackendProviderType> {
  try {
    const response = await fetch(`/api/eligibility/rules/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Get response as text first
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    // Try to parse as JSON
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      console.error('Failed to parse response:', responseText);
      throw new Error(responseText || 'Invalid response from server');
    }

    if (!response.ok) {
      const errorMessage = responseData?.details || responseData?.error || 'Failed to update provider type';
      console.error('Update error:', {
        status: response.status,
        message: errorMessage,
        data: responseData
      });
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    console.error('Service error:', error);
    throw error;
  }
}

export async function getProviderTypeById(id: string): Promise<BackendProviderType> {
  try {
    const response = await fetch(`/api/eligibility/rules/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get response as text first
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    // Try to parse as JSON
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      console.error('Failed to parse response:', responseText);
      throw new Error(responseText || 'Invalid response from server');
    }

    if (!response.ok) {
      const errorMessage = responseData?.details || responseData?.error || 'Failed to fetch provider type';
      console.error('Fetch error:', {
        status: response.status,
        message: errorMessage,
        data: responseData
      });
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    console.error('Service error:', error);
    throw error;
  }
} 