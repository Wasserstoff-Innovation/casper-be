/**
 * FieldValue Type System
 *
 * Represents the comprehensive data structure returned by Wisdom Tree API
 * where each field is wrapped with metadata about its source and quality
 */

export type FieldStatus = 'found' | 'missing' | 'inferred';

/**
 * Generic FieldValue wrapper
 * Every field in the comprehensive brand kit is wrapped in this structure
 */
export interface FieldValue<T> {
  /** The actual data value */
  value: T;

  /** How the data was obtained */
  status: FieldStatus;

  /** Confidence score from 0.0 (no confidence) to 1.0 (completely certain) */
  confidence: number;

  /** Array of sources where this data was found (e.g., ["homepage", "about_page", "llm_analysis"]) */
  source: string[];

  /** Human-readable description of the field and its contents */
  description: string;
}

/**
 * Metadata extracted from a FieldValue
 */
export interface FieldMetadata {
  status: FieldStatus;
  confidence: number;
  sources: string[];
  description: string;
}

/**
 * Value with its metadata attached
 */
export interface EnrichedValue<T> {
  value: T;
  metadata: FieldMetadata;
}

/**
 * Helper to extract value from FieldValue or return direct value
 */
export function getValue<T>(field: FieldValue<T> | T | null | undefined): T | null {
  if (!field) return null;

  // Check if it's a FieldValue (has .value property)
  if (typeof field === 'object' && field !== null && 'value' in field) {
    return (field as FieldValue<T>).value;
  }

  // Direct value
  return field as T;
}

/**
 * Helper to extract array items from FieldValue or return direct array
 */
export function getItems<T>(field: FieldValue<T[]> | T[] | { items: T[] } | null | undefined): T[] {
  if (!field) return [];

  // FieldValue format with .items inside .value
  if (typeof field === 'object' && field !== null && 'value' in field) {
    const value = (field as FieldValue<any>).value;
    if (value?.items && Array.isArray(value.items)) {
      return value.items;
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [];
  }

  // Object with .items property (non-FieldValue format)
  if (typeof field === 'object' && field !== null && 'items' in field && !('value' in field)) {
    return (field as { items: T[] }).items;
  }

  // Direct array
  if (Array.isArray(field)) {
    return field;
  }

  return [];
}

/**
 * Extract metadata from a FieldValue
 */
export function getMetadata(field: any): FieldMetadata | null {
  if (!field || typeof field !== 'object') return null;

  // Check if it's a FieldValue structure
  if ('status' in field && 'confidence' in field) {
    return {
      status: field.status || 'missing',
      confidence: field.confidence ?? 0,
      sources: field.source || [],
      description: field.description || '',
    };
  }

  return null;
}

/**
 * Extract value AND metadata together
 */
export function getEnrichedValue<T>(field: FieldValue<T> | T | null | undefined): EnrichedValue<T> | null {
  if (!field) return null;

  const value = getValue(field);
  const metadata = getMetadata(field);

  if (value === null) return null;

  return {
    value,
    metadata: metadata || {
      status: 'found',
      confidence: 1.0,
      sources: [],
      description: '',
    },
  };
}

/**
 * Check if a field is present (found or inferred, not missing)
 */
export function isFieldPresent(field: any): boolean {
  if (!field) return false;

  // Check FieldValue status
  if (typeof field === 'object' && 'status' in field) {
    return field.status === 'found' || field.status === 'inferred';
  }

  // Check if value exists
  const value = getValue(field);
  if (value === null || value === undefined) return false;

  // Check for empty arrays or empty strings
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === 'string' && value.trim() === '') return false;

  return true;
}

/**
 * Get confidence level as a human-readable label
 */
export function getConfidenceLabel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

/**
 * Batch extract values from multiple fields
 */
export function extractValues<T extends Record<string, any>>(
  fields: T
): { [K in keyof T]: any } {
  const result: any = {};

  for (const key in fields) {
    result[key] = getValue(fields[key]);
  }

  return result;
}

/**
 * Batch extract metadata from multiple fields
 */
export function extractMetadata<T extends Record<string, any>>(
  fields: T
): { [K in keyof T]: FieldMetadata | null } {
  const result: any = {};

  for (const key in fields) {
    result[key] = getMetadata(fields[key]);
  }

  return result;
}
