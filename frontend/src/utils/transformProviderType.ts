import { requirementMetadata } from './requirementMappings';
import type { BackendProviderType, FrontendRequirements } from '@/types/providerTypes';

// No transformation needed - we're using the object format directly
export function validateProviderType(providerData: any): BackendProviderType {
  if (!providerData || typeof providerData !== 'object') {
    throw new Error('Invalid provider data: must be an object');
  }

  if (!providerData.requirements || typeof providerData.requirements !== 'object') {
    throw new Error('Invalid requirements: must be an object with boolean flags');
  }

  return {
    id: providerData.id || '',
    name: providerData.name || '',
    code: providerData.code || providerData.id,
    requirements: providerData.requirements
  };
} 