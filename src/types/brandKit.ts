// Brand Kit Field Wrapper - Every field uses this structure
export type FieldStatus = 'found' | 'inferred' | 'missing' | 'manual';

export interface BrandKitField<T = any> {
  value: T | null;
  status: FieldStatus;
  confidence: number; // 0.0 to 1.0
  description: string;
  usage: string[]; // Where this is used: ["homepage_hero", "navigation", etc.]
  source: string[]; // URLs or ["manual", "ai_generated"]
  notes: string | null;
}

// Helper type for arrays of items with metadata
export interface BrandKitArrayField<T> {
  items: T[];
  status: FieldStatus;
  confidence: number;
  description: string;
  usage: string[];
  source: string[];
  notes: string | null;
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
  role: string; // "primary", "secondary", "accent", "neutral"
  usage: string[]; // ["buttons", "links", "backgrounds"]
  accessibility_notes?: string;
}

export interface TypographyInfo {
  name: string;
  fallbacks?: string[];
  style_notes?: string; // "rounded sans", "serif", etc.
}

export interface BrandKitVisualIdentity {
  logos: {
    primary_logo_url: BrandKitField<string>;
    logo_variations: BrandKitArrayField<{ type: string; url: string }>;
    favicon_url: BrandKitField<string>;
  };
  color_system: {
    primary_colors: BrandKitArrayField<ColorInfo>;
    secondary_colors: BrandKitArrayField<ColorInfo>;
    accent_colors: BrandKitArrayField<ColorInfo>;
    neutrals: BrandKitArrayField<ColorInfo>;
  };
  typography: {
    heading_font: BrandKitField<TypographyInfo>;
    body_font: BrandKitField<TypographyInfo>;
    mono_font: BrandKitField<TypographyInfo>;
  };
  components: {
    button_style: BrandKitField<{ radius: string; type: string; shape: string }>;
    card_style: BrandKitField<{ shadows: boolean; borders: boolean; radius: string }>;
    spacing_vibe: BrandKitField<'tight' | 'airy' | 'balanced'>;
    layout_tags: BrandKitArrayField<string>;
  };
  imagery: {
    style_type: BrandKitField<'photography' | 'illustration' | 'mixed'>;
    illustration_style: BrandKitField<'flat' | 'gradient' | '3D' | 'other'>;
    icon_style: BrandKitField<'outline' | 'filled' | 'duotone'>;
  };
}

// ============================================
// C. VERBAL IDENTITY (VOICE & MESSAGING)
// ============================================
export interface BrandKitVerbalIdentity {
  tagline: BrandKitField<string>;
  elevator_pitch: BrandKitField<string>;
  core_value_props: BrandKitArrayField<string>;
  tone_of_voice: {
    adjectives: BrandKitArrayField<string>;
    guidance: BrandKitField<string>;
  };
  brand_personality: BrandKitField<string>;
  key_phrases: BrandKitArrayField<string>;
  words_to_avoid: BrandKitArrayField<string>;
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
  total_completeness: number; // 0-100 percentage
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
  keyword_overlap: number; // 0-100
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
// MAIN BRAND KIT STRUCTURE
// ============================================
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
  gaps_summary: BrandKitGaps;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

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
    status: 'found',
    confidence,
    description,
    usage,
    source,
    notes: notes || null,
  };
}

export function createInferredField<T>(
  value: T,
  description: string,
  usage: string[],
  confidence: number,
  notes: string
): BrandKitField<T> {
  return {
    value,
    status: 'inferred',
    confidence,
    description,
    usage,
    source: ['ai_inference'],
    notes,
  };
}

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
    status: 'found',
    confidence,
    description,
    usage,
    source,
    notes: notes || null,
  };
}

// Calculate completeness for a section
export function calculateSectionCompleteness(section: any): {
  completeness: number;
  missing_count: number;
  inferred_count: number;
  found_count: number;
} {
  let total = 0;
  let missing = 0;
  let inferred = 0;
  let found = 0;

  function traverse(obj: any) {
    if (obj && typeof obj === 'object') {
      if ('status' in obj && 'confidence' in obj) {
        // This is a BrandKitField
        total++;
        if (obj.status === 'missing') missing++;
        else if (obj.status === 'inferred') inferred++;
        else if (obj.status === 'found') found++;
      } else {
        // Traverse deeper
        Object.values(obj).forEach(traverse);
      }
    }
  }

  traverse(section);

  return {
    completeness: total > 0 ? Math.round((found + inferred * 0.5) / total * 100) : 0,
    missing_count: missing,
    inferred_count: inferred,
    found_count: found,
  };
}

