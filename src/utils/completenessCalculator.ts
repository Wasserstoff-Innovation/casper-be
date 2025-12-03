/**
 * COMPLETENESS CALCULATOR
 *
 * Calculates real-time completion percentage for brand data.
 * Works with both the comprehensive BrandKit structure and legacy flat structures.
 *
 * The completion percentage is calculated as:
 * (fieldsFound + fieldsInferred + fieldsManual) / totalFields * 100
 *
 * This gives us a measure of how much brand data we have vs how much we expect.
 */

import {
  ComprehensiveBrandKit,
  FieldValue,
  ArrayField,
  DataQualityMetrics,
  SectionCompleteness,
  FieldStatus
} from '../types/brand.types';

// Type aliases for backward compatibility
type IComprehensiveBrandKit = ComprehensiveBrandKit;
type IFieldValue<T = any> = FieldValue<T>;
type IArrayField<T = any> = ArrayField<T>;
type IDataQualityMetrics = DataQualityMetrics;
type ISectionCompleteness = SectionCompleteness;

// ============================================================================
// SECTION DEFINITIONS
// ============================================================================

/**
 * Defines the expected fields for each section of the brand kit.
 * Used for calculating section-level and overall completeness.
 */
export const SECTION_FIELD_DEFINITIONS = {
  meta: {
    label: 'Meta & Audit',
    fields: [
      'brand_name',
      'canonical_domain',
      'industry',
      'category',
      'primary_language',
      'company_type',
      'region'
    ],
    weight: 1.0  // Meta is basic, lower weight
  },
  visual_identity: {
    label: 'Visual Identity',
    fields: [
      'logos.primary_logo_url',
      'logos.logo_on_light',
      'logos.logo_on_dark',
      'logos.favicon_url',
      'logos.logo_variations',
      'color_system.primary_colors',
      'color_system.secondary_colors',
      'color_system.accent_colors',
      'color_system.neutrals',
      'color_system.backgrounds',
      'color_system.gradients',
      'typography.heading_font',
      'typography.body_font',
      'typography.mono_font',
      'typography.scale',
      'components.button_style',
      'components.card_style',
      'components.spacing_vibe',
      'imagery.style_type',
      'imagery.icon_style'
    ],
    weight: 1.5  // Visual identity is important
  },
  verbal_identity: {
    label: 'Verbal Identity',
    fields: [
      'tagline',
      'elevator_pitch',
      'value_proposition',
      'core_value_props',
      'brand_story',
      'tone_of_voice.adjectives',
      'tone_of_voice.guidance',
      'brand_personality',
      'key_phrases',
      'words_to_avoid',
      'messaging_pillars'
    ],
    weight: 1.5  // Verbal identity is crucial for messaging
  },
  audience_positioning: {
    label: 'Audience & Positioning',
    fields: [
      'primary_icp',
      'secondary_icps',
      'problems_solved',
      'benefits_promised',
      'category',
      'positioning_statement'
    ],
    weight: 1.3
  },
  product_offers: {
    label: 'Product & Offers',
    fields: [
      'products',
      'plans.plan_names',
      'plans.free_trial',
      'plans.freemium',
      'key_features',
      'guarantees'
    ],
    weight: 1.2
  },
  proof_trust: {
    label: 'Proof & Trust',
    fields: [
      'client_logos',
      'testimonials',
      'case_studies',
      'third_party_reviews',
      'awards_certifications'
    ],
    weight: 1.4  // Trust signals are very important
  },
  seo_identity: {
    label: 'SEO Identity',
    fields: [
      'primary_keywords',
      'secondary_keywords',
      'branded_keywords',
      'technical_score'
    ],
    weight: 1.0
  },
  external_presence: {
    label: 'External Presence',
    fields: [
      'social_profiles',
      'directories_marketplaces',
      'other_properties'
    ],
    weight: 1.1
  },
  content_assets: {
    label: 'Content Assets',
    fields: [
      'blog_present',
      'blog_url',
      'posting_frequency',
      'content_types'
    ],
    weight: 0.8
  },
  competitor_analysis: {
    label: 'Competitor Analysis',
    fields: [
      'competitors_found',
      'top_competitors',
      'insights.market_overview',
      'insights.keyword_opportunities'
    ],
    weight: 0.9
  },
  contact_info: {
    label: 'Contact Info',
    fields: [
      'company_name',
      'website',
      'email',
      'phone',
      'social_links'
    ],
    weight: 0.7
  }
};

export type SectionId = keyof typeof SECTION_FIELD_DEFINITIONS;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a value is a FieldValue wrapper
 */
function isFieldValue(obj: any): obj is IFieldValue {
  return obj && typeof obj === 'object' && 'status' in obj && 'confidence' in obj && 'value' in obj;
}

/**
 * Check if a value is an ArrayField wrapper
 */
function isArrayField(obj: any): obj is IArrayField {
  return obj && typeof obj === 'object' && 'status' in obj && 'confidence' in obj && 'items' in obj;
}

/**
 * Get the status of a field (handling both wrapped and raw values)
 */
function getFieldStatus(obj: any): FieldStatus | null {
  if (!obj) return null;

  if (isFieldValue(obj)) {
    return obj.status;
  }

  if (isArrayField(obj)) {
    return obj.status;
  }

  // For raw values, determine status based on content
  if (Array.isArray(obj)) {
    return obj.length > 0 ? 'found' : 'missing';
  }

  if (typeof obj === 'string') {
    return obj.trim().length > 0 ? 'found' : 'missing';
  }

  if (typeof obj === 'number') {
    return 'found';
  }

  if (typeof obj === 'boolean') {
    return 'found';
  }

  if (typeof obj === 'object' && Object.keys(obj).length > 0) {
    return 'found';
  }

  return 'missing';
}

/**
 * Get the confidence of a field
 */
function getFieldConfidence(obj: any): number {
  if (isFieldValue(obj) || isArrayField(obj)) {
    return obj.confidence || 0;
  }
  // Raw values without wrapper have unknown confidence
  return obj ? 0.5 : 0;
}

/**
 * Check if a field is edited
 */
function isFieldEdited(obj: any): boolean {
  if (isFieldValue(obj) || isArrayField(obj)) {
    return obj.isEdited === true;
  }
  return false;
}

/**
 * Get a nested value from an object using dot notation path
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

// ============================================================================
// MAIN CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate completeness for a single section
 */
export function calculateSectionCompleteness(
  sectionData: any,
  sectionId: SectionId
): ISectionCompleteness {
  const definition = SECTION_FIELD_DEFINITIONS[sectionId];
  const fields = definition.fields;

  let totalFields = fields.length;
  let foundCount = 0;
  let inferredCount = 0;
  let missingCount = 0;
  let manualCount = 0;

  for (const fieldPath of fields) {
    const value = getNestedValue(sectionData, fieldPath);
    const status = getFieldStatus(value);

    switch (status) {
      case 'found':
        foundCount++;
        break;
      case 'inferred':
        inferredCount++;
        break;
      case 'manual':
        manualCount++;
        break;
      case 'missing':
      case null:
      default:
        missingCount++;
        break;
    }
  }

  const filledFields = foundCount + inferredCount + manualCount;
  const completeness = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  return {
    completeness,
    missing_count: missingCount,
    inferred_count: inferredCount,
    found_count: foundCount,
    manual_count: manualCount
  };
}

/**
 * Calculate overall data quality metrics for a comprehensive brand kit
 */
export function calculateDataQualityMetrics(
  brandKit: IComprehensiveBrandKit | null
): IDataQualityMetrics {
  if (!brandKit) {
    return {
      totalFields: 0,
      foundFields: 0,
      inferredFields: 0,
      missingFields: 0,
      manualFields: 0,
      averageConfidence: 0,
      completenessPercentage: 0,
      editedFieldPaths: [],
      by_section: {}
    };
  }

  let totalFields = 0;
  let foundFields = 0;
  let inferredFields = 0;
  let missingFields = 0;
  let manualFields = 0;
  let totalConfidence = 0;
  const editedFieldPaths: string[] = [];
  const bySection: Record<string, ISectionCompleteness> = {};

  // Calculate for each section
  const sectionMapping: Record<SectionId, keyof IComprehensiveBrandKit> = {
    meta: 'meta',
    visual_identity: 'visual_identity',
    verbal_identity: 'verbal_identity',
    audience_positioning: 'audience_positioning',
    product_offers: 'product_offers',
    proof_trust: 'proof_trust',
    seo_identity: 'seo_identity',
    external_presence: 'external_presence',
    content_assets: 'content_assets',
    competitor_analysis: 'competitor_analysis',
    contact_info: 'contact_info'
  };

  for (const [sectionId, dataKey] of Object.entries(sectionMapping)) {
    const sectionData = brandKit[dataKey as keyof IComprehensiveBrandKit];
    const sectionCompleteness = calculateSectionCompleteness(sectionData, sectionId as SectionId);

    bySection[sectionId] = sectionCompleteness;

    // Aggregate totals with weight
    const weight = SECTION_FIELD_DEFINITIONS[sectionId as SectionId].weight;
    const fieldCount = SECTION_FIELD_DEFINITIONS[sectionId as SectionId].fields.length;

    totalFields += fieldCount;
    foundFields += sectionCompleteness.found_count;
    inferredFields += sectionCompleteness.inferred_count;
    missingFields += sectionCompleteness.missing_count;
    manualFields += sectionCompleteness.manual_count;

    // Track edited fields
    if (sectionData) {
      const editedPaths = getEditedFieldPaths(sectionData, sectionId);
      editedFieldPaths.push(...editedPaths);
    }
  }

  // Calculate weighted completeness
  let weightedTotal = 0;
  let weightedFilled = 0;

  for (const [sectionId, sectionCompleteness] of Object.entries(bySection)) {
    const weight = SECTION_FIELD_DEFINITIONS[sectionId as SectionId].weight;
    const fieldCount = SECTION_FIELD_DEFINITIONS[sectionId as SectionId].fields.length;
    const filledCount = sectionCompleteness.found_count + sectionCompleteness.inferred_count + sectionCompleteness.manual_count;

    weightedTotal += fieldCount * weight;
    weightedFilled += filledCount * weight;
  }

  const completenessPercentage = weightedTotal > 0
    ? Math.round((weightedFilled / weightedTotal) * 100)
    : 0;

  // Calculate average confidence from found/inferred fields
  const filledFields = foundFields + inferredFields + manualFields;
  const averageConfidence = filledFields > 0 ? totalConfidence / filledFields : 0;

  return {
    totalFields,
    foundFields,
    inferredFields,
    missingFields,
    manualFields,
    averageConfidence,
    completenessPercentage,
    editedFieldPaths,
    by_section: bySection
  };
}

/**
 * Get all edited field paths from a data object
 */
export function getEditedFieldPaths(obj: any, prefix: string = ''): string[] {
  const paths: string[] = [];

  if (!obj || typeof obj !== 'object') {
    return paths;
  }

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (isFieldValue(value) || isArrayField(value)) {
      if (value.isEdited) {
        paths.push(currentPath);
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recurse into nested objects
      paths.push(...getEditedFieldPaths(value, currentPath));
    }
  }

  return paths;
}

// ============================================================================
// LEGACY STRUCTURE SUPPORT
// ============================================================================

/**
 * Calculate completeness from legacy flat brand kit structure
 * (Used when comprehensive field is not populated)
 */
export function calculateLegacyCompleteness(brandKit: any): number {
  if (!brandKit) return 0;

  const expectedFields = [
    // Visual
    'visual_identity.logo_url',
    'visual_identity.favicon_url',
    'visual_identity.colors.primary',
    'visual_identity.typography.heading',
    'visual_identity.typography.body',
    // Verbal
    'verbal_identity.tagline',
    'verbal_identity.elevator_pitch',
    'verbal_identity.value_proposition',
    'verbal_identity.tone_voice',
    // Proof
    'proof_trust.testimonials_count',
    'proof_trust.case_studies_count',
    'proof_trust.client_logos_count',
    // SEO
    'seo.primary_keywords',
    'seo.technical_score',
    // Content
    'content.has_blog',
    // Conversion
    'conversion.primary_cta_text',
    'conversion.has_pricing_page',
    // Product
    'product.products_count',
    'product.key_features_count'
  ];

  let filledCount = 0;

  for (const fieldPath of expectedFields) {
    const value = getNestedValue(brandKit, fieldPath);

    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        if (value.length > 0) filledCount++;
      } else if (typeof value === 'string') {
        if (value.trim().length > 0) filledCount++;
      } else if (typeof value === 'number') {
        if (value > 0) filledCount++;
      } else if (typeof value === 'boolean') {
        filledCount++; // Boolean fields are always "filled"
      }
    }
  }

  return Math.round((filledCount / expectedFields.length) * 100);
}

/**
 * Calculate completeness from brand profile data
 * (For quick completeness score in list views)
 */
export function calculateProfileCompleteness(profile: any): number {
  if (!profile) return 0;

  const expectedFields = [
    'name',
    'domain',
    'logo_url',
    'elevator_pitch_one_liner',
    'value_proposition',
    'scores.overall',
    'target_customer_profile.role',
    'roadmap.tasks'
  ];

  let filledCount = 0;

  for (const fieldPath of expectedFields) {
    const value = getNestedValue(profile, fieldPath);

    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        if (value.length > 0) filledCount++;
      } else if (typeof value === 'string') {
        if (value.trim().length > 0) filledCount++;
      } else if (typeof value === 'number') {
        filledCount++;
      }
    }
  }

  return Math.round((filledCount / expectedFields.length) * 100);
}

// ============================================================================
// SNAPSHOT BUILDERS
// ============================================================================

/**
 * Build strength/risk items from scores
 */
export function buildStrengthsAndRisks(scores: any): {
  strengths: Array<{ dimension: string; label: string; score: number; description: string }>;
  risks: Array<{ dimension: string; label: string; score: number; description: string }>;
} {
  if (!scores) {
    return { strengths: [], risks: [] };
  }

  const dimensionLabels: Record<string, string> = {
    visual_clarity: 'Visual Clarity',
    verbal_clarity: 'Verbal Clarity',
    positioning: 'Positioning',
    presence: 'Online Presence',
    conversion_trust: 'Conversion & Trust'
  };

  const items: Array<{ dimension: string; label: string; score: number }> = [];

  for (const [key, label] of Object.entries(dimensionLabels)) {
    const score = scores[key];
    if (typeof score === 'number') {
      items.push({ dimension: key, label, score });
    }
  }

  // Sort by score
  items.sort((a, b) => b.score - a.score);

  // Top 2-3 are strengths (score >= 60)
  const strengths = items
    .filter(i => i.score >= 60)
    .slice(0, 3)
    .map(i => ({
      ...i,
      description: `Strong ${i.label.toLowerCase()} (${i.score}/100)`
    }));

  // Bottom 2-3 are risks (score < 60)
  const risks = items
    .filter(i => i.score < 60)
    .slice(-3)
    .map(i => ({
      ...i,
      description: `${i.label} needs improvement (${i.score}/100)`
    }));

  return { strengths, risks };
}

/**
 * Build critical gaps from brand kit data
 */
export function buildCriticalGaps(
  brandKit: IComprehensiveBrandKit | null,
  dataQuality: IDataQualityMetrics
): Array<{
  field: string;
  fieldLabel: string;
  section: string;
  sectionLabel: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}> {
  const gaps: Array<{
    field: string;
    fieldLabel: string;
    section: string;
    sectionLabel: string;
    impact: 'critical' | 'high' | 'medium' | 'low';
    recommendation: string;
  }> = [];

  // Critical fields that should always be present
  const criticalFields = [
    { path: 'verbal_identity.tagline', label: 'Tagline', section: 'verbal_identity', impact: 'critical' as const },
    { path: 'verbal_identity.elevator_pitch', label: 'Elevator Pitch', section: 'verbal_identity', impact: 'critical' as const },
    { path: 'visual_identity.logos.primary_logo_url', label: 'Primary Logo', section: 'visual_identity', impact: 'critical' as const },
    { path: 'visual_identity.color_system.primary_colors', label: 'Primary Colors', section: 'visual_identity', impact: 'high' as const },
    { path: 'audience_positioning.primary_icp', label: 'Target Customer', section: 'audience_positioning', impact: 'high' as const },
    { path: 'proof_trust.testimonials', label: 'Testimonials', section: 'proof_trust', impact: 'medium' as const },
    { path: 'proof_trust.case_studies', label: 'Case Studies', section: 'proof_trust', impact: 'medium' as const }
  ];

  for (const fieldDef of criticalFields) {
    const value = brandKit ? getNestedValue(brandKit, fieldDef.path) : null;
    const status = getFieldStatus(value);

    if (status === 'missing' || status === null) {
      const sectionLabel = SECTION_FIELD_DEFINITIONS[fieldDef.section as SectionId]?.label || fieldDef.section;

      gaps.push({
        field: fieldDef.path,
        fieldLabel: fieldDef.label,
        section: fieldDef.section,
        sectionLabel,
        impact: fieldDef.impact,
        recommendation: getRecommendation(fieldDef.path, fieldDef.label)
      });
    }
  }

  return gaps;
}

/**
 * Get recommendation text for a missing field
 */
function getRecommendation(fieldPath: string, fieldLabel: string): string {
  const recommendations: Record<string, string> = {
    'verbal_identity.tagline': 'Create a memorable tagline that captures your unique value proposition',
    'verbal_identity.elevator_pitch': 'Write a compelling 1-2 sentence pitch explaining what you do',
    'visual_identity.logos.primary_logo_url': 'Upload your primary logo to establish brand recognition',
    'visual_identity.color_system.primary_colors': 'Define your primary brand colors for consistent visual identity',
    'audience_positioning.primary_icp': 'Define your ideal customer profile to focus your messaging',
    'proof_trust.testimonials': 'Collect customer testimonials to build credibility and trust',
    'proof_trust.case_studies': 'Create case studies showcasing customer success stories'
  };

  return recommendations[fieldPath] || `Add ${fieldLabel} to complete your brand profile`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  calculateSectionCompleteness,
  calculateDataQualityMetrics,
  calculateLegacyCompleteness,
  calculateProfileCompleteness,
  buildStrengthsAndRisks,
  buildCriticalGaps,
  getEditedFieldPaths,
  SECTION_FIELD_DEFINITIONS
};
