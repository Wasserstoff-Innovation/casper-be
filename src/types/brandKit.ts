// ============================================
// UNIFIED BRAND KIT FIELD - SINGLE SOURCE OF TRUTH
// ============================================
// This wrapper is used for ALL brand data - both from analysis AND user edits
// No duplication: analysis populates it, users edit the same fields

export type FieldStatus = 'found' | 'inferred' | 'missing' | 'manual';
export type FieldSource = 'scraped' | 'inferred' | 'manual' | 'ai_generated';

/**
 * Unified field wrapper for all brand data.
 * - Analysis populates: value, status, confidence, source
 * - User edits update: value (originalValue preserved), status→'manual', isEdited→true
 * - Reset: restore value from originalValue
 */
export interface BrandKitField<T = any> {
  value: T | null;
  originalValue?: T | null;     // Preserved from analysis for reset
  isEdited?: boolean;           // True if user modified this field
  editedAt?: string;            // ISO timestamp of last edit
  status: FieldStatus;
  confidence: number;           // 0.0 to 1.0
  description: string;
  usage: string[];              // Where used: ["homepage", "cta", "slides"]
  source: string[];             // URLs or ["manual", "ai_generated", "scraped"]
  notes: string | null;
  isLocked?: boolean;           // Prevent accidental edits
}

/**
 * Array field variant with items array instead of single value
 */
export interface BrandKitArrayField<T> {
  items: T[];
  originalItems?: T[];          // Preserved from analysis for reset
  isEdited?: boolean;
  editedAt?: string;
  status: FieldStatus;
  confidence: number;
  description: string;
  usage: string[];
  source: string[];
  notes: string | null;
  isLocked?: boolean;
}

// ============================================
// A. META & AUDIT INFO
// ============================================
export interface BrandKitMeta {
  brand_name: BrandKitField<string>;
  canonical_domain: BrandKitField<string>;
  industry: BrandKitField<string>;
  category: BrandKitField<string>;
  primary_language: BrandKitField<string>;
  company_type: BrandKitField<'B2B' | 'B2C' | 'marketplace' | 'SaaS' | 'ecommerce' | 'other'>;
  region: BrandKitField<string>;
  audit_timestamp: BrandKitField<string>;
  data_sources: BrandKitField<{
    onsite: boolean;
    web_search: boolean;
    screenshots: boolean;
    manual: boolean;
  }>;
}

// ============================================
// B. VISUAL IDENTITY
// ============================================
export interface ColorInfo {
  hex: string;
  name?: string;                // "Electric Blue", "Brand Purple"
  role: string;                 // "primary", "secondary", "accent", "neutral", "background", "text"
  usage: string[];              // ["buttons", "links", "backgrounds"]
  contrastRatio?: number;       // WCAG contrast ratio
  wcagAA?: boolean;
  wcagAAA?: boolean;
  accessibility_notes?: string;
}

export interface GradientInfo {
  name: string;
  type: 'linear' | 'radial';
  angle?: number;
  stops: { color: string; position: number }[];
  css: string;                  // Precomputed CSS
}

export interface TypographyInfo {
  name: string;
  fallbacks?: string[];         // ["system-ui", "sans-serif"]
  weights?: number[];           // [400, 500, 600, 700]
  style?: 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwritten';
  style_notes?: string;         // "rounded sans", "modern serif"
  googleFontsUrl?: string;
  adobeFontsId?: string;
  isVariable?: boolean;
}

export interface TypographyScale {
  baseSize: number;             // 16
  scaleRatio: number;           // 1.25 (Major Third)
  lineHeight: {
    heading: number;            // 1.2
    body: number;               // 1.6
  };
  letterSpacing: {
    heading: string;            // "-0.02em"
    body: string;               // "0"
    caps: string;               // "0.08em"
  };
}

export interface LogoVariantInfo {
  type: 'primary' | 'horizontal' | 'stacked' | 'icon' | 'wordmark' | 'monochrome' | 'light_bg' | 'dark_bg';
  url: string;
  format?: 'svg' | 'png' | 'webp';
  aspectRatio?: string;         // "3:1", "1:1"
  minSize?: string;             // "120px"
  clearSpace?: string;          // "1x logo height"
}

export interface CardStyleInfo {
  borderRadius: string;         // "12px"
  shadow: string;               // CSS box-shadow
  border: string;               // "1px solid #e0e0e0" or "none"
  padding: string;              // "24px"
  background: string;           // Background color
}

export interface ButtonStyleInfo {
  borderRadius: string;
  padding: string;
  fontWeight: number;
  textTransform: 'none' | 'uppercase' | 'capitalize';
  states: {
    default: { bg: string; text: string; border: string };
    hover: { bg: string; text: string; border: string };
    disabled: { bg: string; text: string; border: string };
  };
}

export interface BrandKitVisualIdentity {
  logos: {
    primary_logo_url?: BrandKitField<string>;
    logo_on_light?: BrandKitField<string>;       // Logo for light backgrounds
    logo_on_dark?: BrandKitField<string>;        // Logo for dark backgrounds
    logo_variations?: BrandKitArrayField<LogoVariantInfo>;
    favicon_url?: BrandKitField<string>;
    logo_rules?: BrandKitField<{
      clearSpaceMultiplier: number;
      minDisplaySize: string;
      prohibitedUsage: string[];
    }>;
  };
  color_system?: {
    primary_colors?: BrandKitArrayField<ColorInfo>;
    secondary_colors?: BrandKitArrayField<ColorInfo>;
    accent_colors?: BrandKitArrayField<ColorInfo>;
    neutrals?: BrandKitArrayField<ColorInfo>;
    text_colors?: BrandKitField<{
      on_light: ColorInfo[];                    // Text colors for light backgrounds
      on_dark: ColorInfo[];                     // Text colors for dark backgrounds
    }>;
    backgrounds?: BrandKitField<{
      light: string;                            // Light background hex
      dark: string;                             // Dark background hex
      surface: string;                          // Surface/card background
    }>;
    gradients?: BrandKitArrayField<GradientInfo>;
  };
  typography?: {
    heading_font?: BrandKitField<TypographyInfo>;
    body_font?: BrandKitField<TypographyInfo>;
    mono_font?: BrandKitField<TypographyInfo>;
    accent_font?: BrandKitField<TypographyInfo>;
    scale?: BrandKitField<TypographyScale>;
  };
  components?: {
    button_style?: BrandKitField<ButtonStyleInfo>;
    button_secondary_style?: BrandKitField<ButtonStyleInfo>;
    card_style?: BrandKitField<CardStyleInfo>;
    card_dark_style?: BrandKitField<CardStyleInfo>;  // Card on dark background
    input_style?: BrandKitField<{
      borderRadius: string;
      border: string;
      focusRing: string;
      background: string;
    }>;
    spacing_vibe?: BrandKitField<'tight' | 'airy' | 'balanced'>;
    layout_tags?: BrandKitArrayField<string>;
  };
  imagery?: {
    style_type?: BrandKitField<'photography' | 'illustration' | 'mixed' | '3D'>;
    illustration_style?: BrandKitField<'flat' | 'gradient' | '3D' | 'isometric' | 'hand-drawn' | 'other'>;
    icon_style?: BrandKitField<'outline' | 'filled' | 'duotone' | 'gradient'>;
    sample_images?: BrandKitArrayField<string>;
    style_description?: BrandKitField<string>;
  };
}

// ============================================
// C. VERBAL IDENTITY (VOICE & MESSAGING)
// ============================================
export interface BrandKitVerbalIdentity {
  tagline?: BrandKitField<string>;
  elevator_pitch?: BrandKitField<string>;
  value_proposition?: BrandKitField<string>;
  core_value_props?: BrandKitArrayField<string>;
  brand_story?: BrandKitField<string>;
  tone_of_voice?: {
    adjectives?: BrandKitArrayField<string>;     // ["Bold", "Friendly", "Expert"]
    guidance?: BrandKitField<string>;            // Guidance on how to write
  };
  brand_personality?: BrandKitField<string>;
  key_phrases?: BrandKitArrayField<string>;      // Phrases to use
  words_to_avoid?: BrandKitArrayField<string>;   // Words NOT to use
  brand_words?: BrandKitArrayField<string>;      // Key brand vocabulary
  messaging_pillars?: BrandKitArrayField<string>;// Core messaging themes
}

// ============================================
// D. AUDIENCE & POSITIONING
// ============================================
export interface ICPInfo {
  role: string;
  company_type: string;
  company_size: string;
}

export interface BrandKitAudiencePositioning {
  primary_icp: BrandKitField<ICPInfo>;
  secondary_icps: BrandKitArrayField<ICPInfo>;
  problems_solved: BrandKitArrayField<string>;
  benefits_promised: BrandKitArrayField<string>;
  category: BrandKitField<string>;
  positioning_statement: BrandKitField<string>;
}

// ============================================
// E. PRODUCT & OFFER STRUCTURE
// ============================================
export interface ProductInfo {
  name: string;
  description: string;
}

export interface PlanInfo {
  name: string;
  pricing_notes?: string;
}

export interface BrandKitProductOffers {
  products: BrandKitArrayField<ProductInfo>;
  plans: {
    plan_names: BrandKitArrayField<PlanInfo>;
    free_trial: BrandKitField<boolean>;
    freemium: BrandKitField<boolean>;
    demo_only: BrandKitField<boolean>;
  };
  key_features: BrandKitArrayField<{ theme: string; features: string[] }>;
  guarantees: BrandKitArrayField<string>;
}

// ============================================
// F. PROOF & TRUST SIGNALS
// ============================================
export interface TestimonialInfo {
  quote: string;
  name?: string;
  role?: string;
  company?: string;
}

export interface CaseStudyInfo {
  title: string;
  industry?: string;
  outcomes?: string[];
}

export interface ReviewInfo {
  platform: string;
  url: string;
  rating?: number;
}

export interface BrandKitProofTrust {
  client_logos: BrandKitArrayField<{ name: string; logo_url?: string }>;
  testimonials: BrandKitArrayField<TestimonialInfo>;
  case_studies: BrandKitArrayField<CaseStudyInfo>;
  third_party_reviews: BrandKitArrayField<ReviewInfo>;
  awards_certifications: BrandKitArrayField<{ name: string; badge_url?: string }>;
}

// ============================================
// G. SEO & SEARCH IDENTITY
// ============================================
export interface BrandKitSEOIdentity {
  canonical_pages: BrandKitArrayField<{ type: string; url: string }>;
  primary_keywords: BrandKitArrayField<string>;
  secondary_keywords: BrandKitArrayField<{ theme: string; keywords: string[] }>;
  branded_keywords: BrandKitArrayField<string>;
  serp_snapshot: BrandKitField<{
    owned_results: string[];
    third_party_results: string[];
  }>;
}

// ============================================
// H. EXTERNAL PRESENCE
// ============================================
export interface SocialProfile {
  platform: string;
  url: string;
  handle?: string;
  followers?: number;
}

export interface DirectoryListing {
  name: string;
  url: string;
  rating?: number;
}

export interface BrandKitExternalPresence {
  social_profiles: BrandKitArrayField<SocialProfile>;
  directories_marketplaces: BrandKitArrayField<DirectoryListing>;
  other_properties: BrandKitArrayField<{ type: string; url: string; description?: string }>;
}

// ============================================
// I. CONTENT & ASSET INVENTORY
// ============================================
export interface BrandKitContentAssets {
  blog_present: BrandKitField<boolean>;
  posting_frequency: BrandKitField<string>;
  content_types: BrandKitArrayField<string>;
  estimated_total_assets: BrandKitField<number>;
}

// ============================================
// J. GAPS & ISSUES SUMMARY
// ============================================
export interface GapInfo {
  field: string;
  section: string;
  severity: 'critical' | 'important' | 'nice-to-have';
  recommendation: string;
}

export interface BrandKitGaps {
  critical_gaps: GapInfo[];
  inferred_weak: GapInfo[];
  total_completeness: number;   // 0-100 percentage
  by_section: {
    [key: string]: {
      completeness: number;
      missing_count: number;
      inferred_count: number;
    };
  };
}

// ============================================
// K. COMPETITOR ANALYSIS
// ============================================
export interface CompetitorInfo {
  name: string;
  domain: string;
  keyword_overlap: number;      // 0-100
  market_position?: string;
  strengths?: string[];
  weaknesses?: string[];
}

export interface BrandKitCompetitorAnalysis {
  keyword_categories: BrandKitField<{
    brand_terms: string[];
    problem_solution: string[];
    feature_based: string[];
    comparison: string[];
  }>;
  competitors_found: BrandKitField<number>;
  top_competitors: BrandKitArrayField<CompetitorInfo>;
  insights: {
    market_overview: BrandKitField<string>;
    keyword_opportunities: BrandKitArrayField<{ keyword: string; opportunity: string }>;
    awareness_strategy: BrandKitField<string>;
    competitor_weaknesses: BrandKitArrayField<{ competitor: string; weakness: string }>;
  };
}

// ============================================
// L. CONTACT INFO (for brand kit slides)
// ============================================
export interface BrandKitContactInfo {
  company_name: BrandKitField<string>;
  website: BrandKitField<string>;
  email: BrandKitField<string>;
  phone: BrandKitField<string>;
  address: BrandKitField<string>;
  social_links: BrandKitArrayField<{ platform: string; url: string; handle: string }>;
  footer_text: BrandKitField<string>;           // "© 2025 Brand Name"
}

// ============================================
// MAIN COMPREHENSIVE BRAND KIT STRUCTURE
// ============================================
// This is the SINGLE SOURCE OF TRUTH for all brand data.
// Analysis populates it, users edit it, visual kit reads from it.
export interface ComprehensiveBrandKit {
  meta: BrandKitMeta;
  visual_identity: BrandKitVisualIdentity;
  verbal_identity: BrandKitVerbalIdentity;
  audience_positioning: BrandKitAudiencePositioning;
  product_offers: BrandKitProductOffers;
  proof_trust: BrandKitProofTrust;
  seo_identity: BrandKitSEOIdentity;
  external_presence: BrandKitExternalPresence;
  content_assets: BrandKitContentAssets;
  competitor_analysis: BrandKitCompetitorAnalysis;
  contact_info: BrandKitContactInfo;
  gaps_summary: BrandKitGaps;
}

// ============================================
// VISUAL KIT UI CONFIGURATION (NOT DATA)
// ============================================
// This only stores UI/presentation settings, NOT brand data.
// All actual data comes from ComprehensiveBrandKit above.

export type SlideType =
  | 'cover'
  | 'logo_showcase'
  | 'color_palette'
  | 'typography'
  | 'card_components'
  | 'button_components'
  | 'brand_voice'
  | 'imagery_style'
  | 'contact';

export interface SlideLayoutConfig {
  splitMode: 'full' | 'half-vertical' | 'half-horizontal' | 'thirds';
  darkSide?: 'left' | 'right' | 'top' | 'bottom';
  padding: string;
  gridColumns?: number;
}

export interface SlideDisplayOptions {
  // Cover slide
  backgroundType?: 'color' | 'gradient' | 'image';
  backgroundValue?: string;
  
  // Logo slide
  showClearSpaceDemo?: boolean;
  showProhibitedUsage?: boolean;
  
  // Color slide
  colorDisplayMode?: 'swatches' | 'circles' | 'bars' | 'grid';
  showHexCodes?: boolean;
  showColorNames?: boolean;
  showAccessibility?: boolean;
  
  // Typography slide
  showSampleText?: boolean;
  showWeights?: boolean;
  showScale?: boolean;
  sampleTextHeading?: string;
  sampleTextBody?: string;
  
  // Component slides
  showOnLight?: boolean;
  showOnDark?: boolean;
  showButtonStates?: boolean;
  
  // Card demo content
  cardDemoTitle?: string;
  cardDemoDescription?: string;
  cardDemoCta?: string;
  
  // Button labels
  buttonLabelPrimary?: string;
  buttonLabelSecondary?: string;
  buttonLabelOutline?: string;
  
  // Contact slide
  showPortraitCard?: boolean;
  showLandscapeCard?: boolean;
}

export interface SlideConfig {
  id: string;
  type: SlideType;
  title: string;
  subtitle?: string;
  enabled: boolean;
  order: number;
  layout: SlideLayoutConfig;
  displayOptions: SlideDisplayOptions;
}

export interface VisualKitUIConfig {
  slides: SlideConfig[];
  settings: {
    aspectRatio: '16:9' | '4:3' | '1:1' | 'A4';
    exportFormat: 'pdf' | 'png' | 'pptx';
    includePageNumbers: boolean;
    watermark?: string;
  };
  lastEditedAt?: string;
}

// Default slides configuration
export const DEFAULT_SLIDES: SlideConfig[] = [
  {
    id: 'slide-cover',
    type: 'cover',
    title: 'Brand Guidelines',
    subtitle: '',
    enabled: true,
    order: 1,
    layout: { splitMode: 'full', padding: '64px' },
    displayOptions: { backgroundType: 'color' }
  },
  {
    id: 'slide-logo',
    type: 'logo_showcase',
    title: 'Logo System',
    subtitle: 'Primary logo and variations',
    enabled: true,
    order: 2,
    layout: { splitMode: 'half-vertical', darkSide: 'right', padding: '48px' },
    displayOptions: { showClearSpaceDemo: true, showProhibitedUsage: true }
  },
  {
    id: 'slide-colors',
    type: 'color_palette',
    title: 'Color Palette',
    subtitle: 'Light & Dark modes',
    enabled: true,
    order: 3,
    layout: { splitMode: 'half-vertical', darkSide: 'right', padding: '48px' },
    displayOptions: { colorDisplayMode: 'swatches', showHexCodes: true, showColorNames: true }
  },
  {
    id: 'slide-typography',
    type: 'typography',
    title: 'Typography',
    subtitle: 'Font system and hierarchy',
    enabled: true,
    order: 4,
    layout: { splitMode: 'full', padding: '48px' },
    displayOptions: { showSampleText: true, showWeights: true, showScale: true }
  },
  {
    id: 'slide-cards',
    type: 'card_components',
    title: 'Card Components',
    subtitle: 'Light & Dark backgrounds',
    enabled: true,
    order: 5,
    layout: { splitMode: 'half-vertical', darkSide: 'right', padding: '48px' },
    displayOptions: { showOnLight: true, showOnDark: true }
  },
  {
    id: 'slide-buttons',
    type: 'button_components',
    title: 'Buttons & CTAs',
    subtitle: 'Interactive elements',
    enabled: true,
    order: 6,
    layout: { splitMode: 'full', padding: '48px', gridColumns: 3 },
    displayOptions: { showButtonStates: true }
  },
  {
    id: 'slide-voice',
    type: 'brand_voice',
    title: 'Brand Voice',
    subtitle: 'Tone & personality',
    enabled: true,
    order: 7,
    layout: { splitMode: 'full', padding: '48px' },
    displayOptions: {}
  },
  {
    id: 'slide-contact',
    type: 'contact',
    title: 'Get in Touch',
    subtitle: '',
    enabled: true,
    order: 8,
    layout: { splitMode: 'full', padding: '64px' },
    displayOptions: { showPortraitCard: true, showLandscapeCard: false }
  }
];

// ============================================
// DATA QUALITY TRACKING
// ============================================
export interface DataQualityMetrics {
  totalFields: number;
  foundFields: number;
  inferredFields: number;
  missingFields: number;
  manualFields: number;          // User-edited fields
  averageConfidence: number;     // 0.0 - 1.0
  editedFieldPaths: string[];    // ["meta.brand_name", "visual_identity.color_system.primary_colors"]
  lastAnalyzedAt?: string;
  lastEditedAt?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a field with "found" status (from analysis)
 */
export function createFoundField<T>(
  value: T,
  description: string,
  usage: string[],
  source: string[],
  confidence: number = 1.0,
  notes?: string
): BrandKitField<T> {
  return {
    value,
    originalValue: value,
    isEdited: false,
    status: 'found',
    confidence,
    description,
    usage,
    source,
    notes: notes || null,
  };
}

/**
 * Create a field with "inferred" status (AI-generated)
 */
export function createInferredField<T>(
  value: T,
  description: string,
  usage: string[],
  confidence: number,
  notes: string
): BrandKitField<T> {
  return {
    value,
    originalValue: value,
    isEdited: false,
    status: 'inferred',
    confidence,
    description,
    usage,
    source: ['ai_inference'],
    notes,
  };
}

/**
 * Create a field with "missing" status (not found)
 */
export function createMissingField<T = any>(
  description: string,
  usage: string[],
  notes?: string
): BrandKitField<T> {
  return {
    value: null,
    status: 'missing',
    confidence: 0.0,
    description,
    usage,
    source: [],
    notes: notes || null,
  };
}

/**
 * Create a field with "manual" status (user-entered)
 */
export function createManualField<T>(
  value: T,
  description: string,
  usage: string[]
): BrandKitField<T> {
  return {
    value,
    originalValue: null,
    isEdited: true,
    editedAt: new Date().toISOString(),
    status: 'manual',
    confidence: 1.0,
    description,
    usage,
    source: ['manual'],
    notes: null,
  };
}

/**
 * Create an array field with "found" status
 */
export function createFoundArrayField<T>(
  items: T[],
  description: string,
  usage: string[],
  source: string[],
  confidence: number = 1.0,
  notes?: string
): BrandKitArrayField<T> {
  return {
    items,
    originalItems: [...items],
    isEdited: false,
    status: 'found',
    confidence,
    description,
    usage,
    source,
    notes: notes || null,
  };
}

/**
 * Create an array field with "missing" status
 */
export function createMissingArrayField<T>(
  description: string,
  usage: string[],
  notes?: string
): BrandKitArrayField<T> {
  return {
    items: [],
    status: 'missing',
    confidence: 0.0,
    description,
    usage,
    source: [],
    notes: notes || null,
  };
}

/**
 * Update a field with user edit (preserves originalValue)
 */
export function updateFieldWithEdit<T>(
  field: BrandKitField<T>,
  newValue: T
): BrandKitField<T> {
  return {
    ...field,
    value: newValue,
    originalValue: field.originalValue ?? field.value,  // Preserve original if not already set
    isEdited: true,
    editedAt: new Date().toISOString(),
    status: 'manual',
    source: [...(field.source || []).filter(s => s !== 'manual'), 'manual'],
  };
}

/**
 * Reset a field to its original value
 */
export function resetFieldToOriginal<T>(field: BrandKitField<T>): BrandKitField<T> {
  if (field.originalValue === undefined) {
    return field;  // No original to reset to
  }
  return {
    ...field,
    value: field.originalValue,
    isEdited: false,
    editedAt: undefined,
    status: field.originalValue !== null ? 'found' : 'missing',
    source: field.source?.filter(s => s !== 'manual') || [],
  };
}

/**
 * Calculate completeness metrics for a section
 */
export function calculateSectionCompleteness(section: any): {
  completeness: number;
  missing_count: number;
  inferred_count: number;
  found_count: number;
  manual_count: number;
} {
  let total = 0;
  let missing = 0;
  let inferred = 0;
  let found = 0;
  let manual = 0;

  function traverse(obj: any) {
    if (obj && typeof obj === 'object') {
      if ('status' in obj && 'confidence' in obj) {
        total++;
        if (obj.status === 'missing') missing++;
        else if (obj.status === 'inferred') inferred++;
        else if (obj.status === 'found') found++;
        else if (obj.status === 'manual') manual++;
      } else if (!Array.isArray(obj)) {
        Object.values(obj).forEach(traverse);
      }
    }
  }

  traverse(section);

  const filledFields = found + inferred + manual;
  return {
    completeness: total > 0 ? Math.round((filledFields / total) * 100) : 0,
    missing_count: missing,
    inferred_count: inferred,
    found_count: found,
    manual_count: manual,
  };
}

/**
 * Get all edited field paths from a brand kit
 */
export function getEditedFieldPaths(obj: any, prefix: string = ''): string[] {
  const paths: string[] = [];
  
  function traverse(current: any, currentPath: string) {
    if (current && typeof current === 'object') {
      if ('isEdited' in current && current.isEdited === true) {
        paths.push(currentPath);
      } else if (!Array.isArray(current)) {
        Object.entries(current).forEach(([key, value]) => {
          traverse(value, currentPath ? `${currentPath}.${key}` : key);
        });
      }
    }
  }
  
  traverse(obj, prefix);
  return paths;
}

/**
 * Calculate overall data quality metrics
 */
export function calculateDataQuality(brandKit: ComprehensiveBrandKit): DataQualityMetrics {
  let totalFields = 0;
  let foundFields = 0;
  let inferredFields = 0;
  let missingFields = 0;
  let manualFields = 0;
  let totalConfidence = 0;
  const editedPaths: string[] = [];

  function traverse(obj: any, path: string = '') {
    if (obj && typeof obj === 'object') {
      if ('status' in obj && 'confidence' in obj) {
        totalFields++;
        totalConfidence += obj.confidence || 0;
        
        if (obj.status === 'found') foundFields++;
        else if (obj.status === 'inferred') inferredFields++;
        else if (obj.status === 'missing') missingFields++;
        else if (obj.status === 'manual') manualFields++;
        
        if (obj.isEdited) {
          editedPaths.push(path);
        }
      } else if (!Array.isArray(obj)) {
        Object.entries(obj).forEach(([key, value]) => {
          traverse(value, path ? `${path}.${key}` : key);
        });
      }
    }
  }

  traverse(brandKit);

  return {
    totalFields,
    foundFields,
    inferredFields,
    missingFields,
    manualFields,
    averageConfidence: totalFields > 0 ? totalConfidence / totalFields : 0,
    editedFieldPaths: editedPaths,
  };
}
