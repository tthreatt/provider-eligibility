import type { BackendProviderType, BackendRequirement, FrontendRequirements } from '@/types/providerTypes';
import { requirementMetadata } from '@/utils/requirementMappings';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Custom error class for validation errors
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Generate a code from a provider type name
 */
function generateProviderTypeCode(name: string): string {
  const code = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  console.log('Generated code:', { name, code });
  return code;
}

function transformToBackendFormat(data: BackendProviderType) {
  console.log('Starting transformation:', {
    input: data,
    hasCode: Boolean(data.code),
    codeValue: data.code
  });

  // Convert boolean flags to array of requirements
  const requirements = Object.entries(data.requirements || {}).map(([key, isRequired]) => {
    const metadata = requirementMetadata[key as keyof FrontendRequirements];
    if (!metadata) {
      console.warn(`Skipping requirement with missing metadata: ${key}`);
      return null;
    }

    const requirement = {
      requirement_type: metadata.requirement_type,
      name: metadata.name,
      description: metadata.description,
      is_required: isRequired,
      validation_rules: metadata.validation_rules,
      base_requirement_id: metadata.base_requirement_id
    };

    console.log('Transformed requirement:', {
      key,
      isRequired,
      requirement
    });

    return requirement;
  }).filter((req): req is BackendRequirement => req !== null);

  // Ensure we have the code field
  const code = data.code || generateProviderTypeCode(data.name);

  const transformedData = {
    id: data.id,
    name: data.name,
    code,
    requirements
  };

  console.log('Transformation complete:', {
    input: data,
    output: transformedData,
    requirementsCount: requirements.length,
    hasCode: Boolean(transformedData.code),
    codeValue: transformedData.code
  });

  return transformedData;
}

export const updateProviderType = async (
  providerType: BackendProviderType
): Promise<BackendProviderType> => {
  console.log('Updating provider type:', providerType);

  try {
    // Transform the data before sending to the API
    const transformedData = transformToBackendFormat(providerType);
    console.log('Sending transformed data to API:', transformedData);

    const response = await fetch(
      `${API_BASE_URL}/eligibility/rules/${providerType.id || ''}`,
      {
        method: providerType.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      }
    );

    if (!response.ok) {
      if (response.status === 422) {
        const error = await response.json();
        console.error('Validation error:', error);
        throw new ValidationError(error.message || 'Validation failed');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('API response:', result);
    return result;
  } catch (error) {
    console.error('Error updating provider type:', error);
    throw error;
  }
}; 