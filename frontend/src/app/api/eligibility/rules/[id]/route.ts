import { NextResponse } from 'next/server';
import { API_ROUTES } from '@/config/api';
import { requirementMetadata } from '@/utils/requirementMappings';
import type { BackendProviderType, Requirement } from '@/types/providerTypes';

// Transform frontend data to backend format
async function transformToBackendFormat(frontendData: BackendProviderType, existingTypeId: string) {
  // First, fetch all provider types from backend
  const response = await fetch(`${API_ROUTES.ELIGIBILITY_RULES}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Get response as text first
  const responseText = await response.text();
  console.log('Raw GET response in transform:', responseText);

  // Try to parse as JSON
  let allTypes;
  try {
    allTypes = responseText ? JSON.parse(responseText) : null;
  } catch (e) {
    console.error('Failed to parse response:', responseText);
    throw new Error('Invalid backend response');
  }

  if (!response.ok) {
    throw new Error(allTypes?.detail || 'Failed to fetch provider types');
  }

  // Find the specific provider type
  const existingType = allTypes.find((type: any) => type.id.toString() === existingTypeId);
  
  if (!existingType) {
    throw new Error(`No provider type found with id ${existingTypeId}`);
  }

  console.log('Found existing type:', existingType);

  // Generate code from name
  const code = frontendData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

  // Create a map of requirement types to existing requirements
  const existingRequirements = new Map(
    existingType.requirements.map((req: Requirement) => [req.requirement_type, req])
  );

  // Convert frontend boolean flags to backend requirement objects
  const requirements = Object.entries(frontendData.requirements).map(([key, isRequired]) => {
    const metadata = requirementMetadata[key];
    if (!metadata) {
      throw new Error(`Missing metadata for requirement: ${key}`);
    }

    // Find existing requirement
    const existingReq = existingRequirements.get(metadata.requirement_type) as Requirement | undefined;
    
    return {
      requirement_type: metadata.requirement_type,
      name: metadata.name,
      description: metadata.description,
      is_required: isRequired,
      validation_rules: metadata.validation_rules,
      // Preserve existing IDs if available
      base_requirement_id: existingReq?.base_requirement_id,
      provider_type_id: parseInt(existingTypeId)
    };
  });

  return {
    id: parseInt(existingTypeId),
    code,
    name: frontendData.name,
    requirements
  };
}

// Validate transformed data
function validateTransformedData(data: any) {
  if (!data.code || typeof data.code !== 'string') {
    throw new Error('Invalid code field');
  }
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Invalid name field');
  }
  if (!Array.isArray(data.requirements)) {
    throw new Error('Requirements must be an array');
  }
  
  data.requirements.forEach((req: any, index: number) => {
    if (!req.requirement_type || typeof req.requirement_type !== 'string') {
      throw new Error(`Invalid requirement_type at index ${index}`);
    }
    if (!req.name || typeof req.name !== 'string') {
      throw new Error(`Invalid requirement name at index ${index}`);
    }
    if (!req.description || typeof req.description !== 'string') {
      throw new Error(`Invalid requirement description at index ${index}`);
    }
    if (typeof req.is_required !== 'boolean') {
      throw new Error(`Invalid is_required at index ${index}`);
    }
    if (!req.validation_rules || typeof req.validation_rules !== 'object') {
      throw new Error(`Invalid validation_rules at index ${index}`);
    }
  });
}

// Add GET handler for single provider type
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch all provider types from backend
    const response = await fetch(`${API_ROUTES.ELIGIBILITY_RULES}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get response as text first
    const responseText = await response.text();
    console.log('Raw GET response:', responseText);

    // Try to parse as JSON
    let allTypes;
    try {
      allTypes = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      console.error('Failed to parse response:', responseText);
      return NextResponse.json(
        { error: 'Invalid backend response', details: responseText },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch provider types', details: allTypes?.detail || 'Unknown error' },
        { status: response.status }
      );
    }

    // Find the specific provider type
    const providerType = allTypes.find((type: any) => type.id.toString() === params.id);
    
    if (!providerType) {
      return NextResponse.json(
        { error: 'Provider type not found', details: `No provider type found with id ${params.id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(providerType);
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider type', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    console.log('Received update request for provider type:', {
      id: params.id,
      data: JSON.stringify(data, null, 2)
    });

    // Transform the data
    const transformedData = await transformToBackendFormat(data, params.id);
    console.log('Transformed data being sent to backend:', JSON.stringify(transformedData, null, 2));

    // Send to backend
    const response = await fetch(`${API_ROUTES.ELIGIBILITY_RULES}/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedData),
    });

    // Get response as text first
    const responseText = await response.text();
    console.log('Raw backend response:', responseText);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    // Try to parse as JSON
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
      console.log('Parsed response data:', responseData);
    } catch (e) {
      console.error('Failed to parse backend response:', responseText);
      console.error('Parse error:', e);
      return NextResponse.json(
        { error: 'Invalid backend response', details: responseText },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('Backend error:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        text: responseText
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to update provider type',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 