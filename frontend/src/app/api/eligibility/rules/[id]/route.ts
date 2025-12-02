import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import type { BackendProviderType, BackendRequirement } from '@/types/providerTypes';
import { generateProviderTypeCode } from '@/types/providerTypes';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// Type guard for BackendRequirement
function isBackendRequirement(value: any): value is BackendRequirement {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.requirement_type === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.is_required === 'boolean' &&
    typeof value.validation_rules === 'object' &&
    typeof value.base_requirement_id === 'number'
  );
}

// Type guard for array of BackendRequirement
function isBackendRequirementArray(value: any): value is BackendRequirement[] {
  return Array.isArray(value) && value.every(isBackendRequirement);
}

// Validation function for provider type data
function validateProviderTypeData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name) {
    errors.push('Name is required');
  }

  if (!data.code) {
    errors.push('Code is required');
  }

  if (!data.requirements || !Array.isArray(data.requirements) || data.requirements.length === 0) {
    errors.push('At least one requirement is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the auth session
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: 'No user session found'
      }, { status: 401 });
    }

    const data = await request.json();
    console.log('Received update request for provider type:', {
      id: params.id,
      data: JSON.stringify(data, null, 2)
    });

    // Convert requirements to array format if it's not already
    const requirements = Array.isArray(data.requirements) 
      ? data.requirements 
      : Object.entries(data.requirements).map(([type, isRequired]) => ({
          requirement_type: type,
          name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: `${type} requirement`,
          is_required: isRequired,
          validation_rules: {},
          base_requirement_id: 1, // This should be mapped correctly based on requirement type
          provider_type_id: parseInt(params.id)
        })) as BackendRequirement[];

    // Ensure code exists
    const providerTypeData = {
      ...data,
      id: params.id,
      code: data.code || generateProviderTypeCode(data.name),
      requirements
    } as BackendProviderType;

    // Validate the data
    const validation = validateProviderTypeData(providerTypeData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 422 }
      );
    }

    // Update provider_type_id for each requirement
    const updatedRequirements = requirements.map((req: BackendRequirement) => ({
      ...req,
      provider_type_id: parseInt(params.id)
    }));

    const finalData: BackendProviderType = {
      ...providerTypeData,
      requirements: updatedRequirements
    };

    console.log('Data being sent to backend:', JSON.stringify(finalData, null, 2));

    // Send to backend
    const response = await fetch(`${BACKEND_URL}/api/eligibility/rules/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.API_KEY || '',
      },
      body: JSON.stringify(finalData),
    });

    // Get response as text first
    const responseText = await response.text();
    console.log('Raw backend response:', responseText);

    // Try to parse as JSON
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      console.error('Failed to parse backend response:', responseText);
      return NextResponse.json(
        { error: 'Invalid backend response', details: responseText },
        { status: 500 }
      );
    }

    if (!response.ok) {
      // Handle Pydantic validation errors
      if (response.status === 422 && Array.isArray(responseData?.details)) {
        const formattedErrors = responseData.details.map((error: any) => {
          const field = error.loc.slice(1).join('.');
          return `${field}: ${error.msg}`;
        });
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: formattedErrors
          },
          { status: 422 }
        );
      }

      console.error('Backend error:', {
        status: response.status,
        data: responseData
      });
      return NextResponse.json(
        { 
          error: 'Failed to update provider type',
          details: responseData?.detail || responseData?.error || 'Unknown error'
        },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 