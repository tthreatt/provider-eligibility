import { requirementMetadata } from './requirementMappings';
import { BackendProviderType } from '@/types/providerTypes';

export function transformToBackendFormat(frontendData: BackendProviderType) {
  // Log incoming data
  console.log('Transforming frontend data:', frontendData);

  // Convert frontend boolean flags to backend requirement objects
  const requirements = Object.entries(frontendData.requirements).map(([key, isRequired]) => {
    const metadata = requirementMetadata[key];
    if (!metadata) {
      throw new Error(`Missing metadata for requirement: ${key}`);
    }
    return {
      ...metadata,
      is_required: isRequired
    };
  });

  const backendData = {
    id: frontendData.id,
    name: frontendData.name,
    code: frontendData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    requirements
  };

  // Log outgoing data
  console.log('Transformed backend data:', backendData);
  return backendData;
} 