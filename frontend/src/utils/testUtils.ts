/**
 * Utility functions for testing
 */

/**
 * Generates a test ID for detail fields with a consistent, predictable format
 * @param label The field label (e.g., 'issuer', 'type', 'expiration date')
 * @param value The field value
 * @returns A formatted test ID string
 */
export const generateDetailTestId = (label: string, value: string): string => {
  // Convert label to lowercase and replace spaces with hyphens
  const normalizedLabel = label.toLowerCase().replace(/\s+/g, '-');
  
  // Special handling for known issuers
  if (normalizedLabel === 'issuer') {
    if (value.toLowerCase().includes('american board of medical specialties')) {
      return 'detail-field-issuer-abms-american-board-of-medical-specialties';
    }
    if (value.toLowerCase().includes('american heart association')) {
      return 'detail-field-issuer-american-heart-association';
    }
    if (value.toLowerCase().includes('tennessee')) {
      return 'detail-field-issuer-tennessee';
    }
  }
  
  // For expiration dates, keep the YYYY-MM-DD format
  if (normalizedLabel === 'expiration-date') {
    return `detail-field-${normalizedLabel}-${value}`;
  }
  
  // For all other fields, convert to lowercase and replace non-alphanumeric with hyphens
  const normalizedValue = value.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `detail-field-${normalizedLabel}-${normalizedValue}`;
}; 