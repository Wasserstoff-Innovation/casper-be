/**
 * BRAND TYPES - SINGLE SOURCE OF TRUTH
 *
 * This file contains ALL brand-related types used across the application.
 * DO NOT define brand types anywhere else.
 *
 * Structure:
 * 1. Field Wrappers (FieldValue, ArrayField)
 * 2. Visual Identity Types
 * 3. Verbal Identity Types
 * 4. Audience & Positioning Types
 * 5. Product & Offers Types
 * 6. Proof & Trust Types
 * 7. SEO Types
 * 8. External Presence Types
 * 9. Competitor Analysis Types
 * 10. Contact Info Types
 * 11. Gaps & Quality Types
 * 12. Comprehensive Brand Kit Structure
 * 13. DB Collection Interfaces
 * 14. API Response Types
 */

// ============================================================================
// 1. FIELD VALUE WRAPPERS
// ============================================================================

export type FieldStatus = 'found' | 'inferred' | 'missing' | 'manual';

/**
 * Wrapper for single-value fields with metadata
 */
export interface FieldValue<T = any> {
  value: T | null;
  originalValue?: T | null;
  isEdited?: boolean;
  editedAt?: string;
  status: FieldStatus;
  confidence: number;           // 0.0 to 1.0
  description?: string;
  usage?: string[];
  source?: string[];
  notes?: string | null;
  isLocked?: boolean;
}

/**
 * Wrapper for array fields with metadata
 */
export interface ArrayField<T = any> {
  items: T[];
  originalItems?: T[];
  isEdited?: boolean;
  editedAt?: string;
  status: FieldStatus;
  confidence: number;
  description?: string;
  usage?: string[];
  source?: string[];
  notes?: string | null;
  isLocked?: boolean;
}

// ============================================================================
// 2. VISUAL IDENTITY TYPES
// ============================================================================

export interface ColorInfo {
  hex: string;
  name?: string;
  role: string;                 // primary, secondary, accent, neutral, background, text
  usage?: string[];
  contrastRatio?: number;
  wcagAA?: boolean;
  wcagAAA?: boolean;
  accessibility_notes?: string;
}

export interface GradientInfo {
  name: string;
  type: 'linear' | 'radial';
  angle?: number;
  stops: { color: string; position: number }[];
  css: string;
}

export interface TypographyInfo {
  name: string;
  fallbacks?: string[];
  weights?: number[];
  style?: 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwritten';
  style_notes?: string;
  googleFontsUrl?: string;
  adobeFontsId?: string;
  isVariable?: boolean;
}

export interface TypographyScale {
  baseSize: number;
  scaleRatio: number;
  lineHeight: { heading: number; body: number };
  letterSpacing: { heading: string; body: string; caps: string };
}

export interface LogoVariant {
  type: 'primary' | 'horizontal' | 'stacked' | 'icon' | 'wordmark' | 'monochrome' | 'light_bg' | 'dark_bg';
  url: string;
  format?: 'svg' | 'png' | 'webp';
  aspectRatio?: string;
  minSize?: string;
  clearSpace?: string;
}

export interface LogoRules {
  clearSpaceMultiplier: number;
  minDisplaySize: string;
  prohibitedUsage: string[];
}

export interface ButtonStyle {
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

export interface CardStyle {
  borderRadius: string;
  shadow: string;
  border: string;
  padding: string;
  background: string;
}

export interface InputStyle {
  borderRadius: string;
  border: string;
  focusRing: string;
  background: string;
}

export interface TextColors {
  on_light: ColorInfo[];
  on_dark: ColorInfo[];
}

export interface Backgrounds {
  light: string;
  dark: string;
  surface: string;
}

// ============================================================================
// 3. VERBAL IDENTITY TYPES
// ============================================================================

export interface ToneOfVoice {
  adjectives?: ArrayField<string>;
  guidance?: FieldValue<string>;
}

// ============================================================================
// 4. AUDIENCE & POSITIONING TYPES
// ============================================================================

export interface ICPInfo {
  role: string;
  company_type: string;
  company_size: string;
}

// ============================================================================
// 5. PRODUCT & OFFERS TYPES
// ============================================================================

export interface ProductInfo {
  name: string;
  description: string;
}

export interface PlanInfo {
  name: string;
  pricing_notes?: string;
}

export interface FeatureGroup {
  theme: string;
  features: string[];
}

// ============================================================================
// 6. PROOF & TRUST TYPES
// ============================================================================

export interface Testimonial {
  quote: string;
  name?: string;
  role?: string;
  company?: string;
  avatar_url?: string;
}

export interface CaseStudy {
  title: string;
  industry?: string;
  outcomes?: string[];
  url?: string;
}

export interface Review {
  platform: string;
  url: string;
  rating?: number;
  review_count?: number;
}

export interface Award {
  name: string;
  badge_url?: string;
  year?: number;
}

export interface ClientLogo {
  name: string;
  logo_url?: string;
}

// ============================================================================
// 7. SEO TYPES
// ============================================================================

export interface KeywordGroup {
  theme: string;
  keywords: string[];
}

export interface CanonicalPage {
  type: string;
  url: string;
}

export interface SerpSnapshot {
  owned_results: string[];
  third_party_results: string[];
}

// ============================================================================
// 8. EXTERNAL PRESENCE TYPES
// ============================================================================

export interface SocialProfile {
  platform: string;
  url: string;
  handle?: string;
  followers?: number;
  verified?: boolean;
}

export interface DirectoryListing {
  name: string;
  url: string;
  rating?: number;
}

export interface OtherProperty {
  type: string;
  url: string;
  description?: string;
}

// ============================================================================
// 9. COMPETITOR ANALYSIS TYPES
// ============================================================================

export interface CompetitorInfo {
  name: string;
  domain: string;
  keyword_overlap: number;
  market_position?: string;
  strengths?: string[];
  weaknesses?: string[];
}

export interface KeywordOpportunity {
  keyword: string;
  opportunity: string;
}

export interface CompetitorWeakness {
  competitor: string;
  weakness: string;
}

export interface KeywordCategories {
  brand_terms: string[];
  problem_solution: string[];
  feature_based: string[];
  comparison: string[];
}

// ============================================================================
// 10. CONTACT INFO TYPES
// ============================================================================

export interface SocialLink {
  platform: string;
  url: string;
  handle: string;
}

// ============================================================================
// 11. GAPS & QUALITY TYPES
// ============================================================================

export interface GapInfo {
  field: string;
  section: string;
  severity: 'critical' | 'important' | 'nice-to-have';
  recommendation: string;
}

export interface SectionCompleteness {
  completeness: number;
  missing_count: number;
  inferred_count: number;
  found_count: number;
  manual_count: number;
}

export interface DataQualityMetrics {
  totalFields: number;
  foundFields: number;
  inferredFields: number;
  missingFields: number;
  manualFields: number;
  averageConfidence: number;
  completenessPercentage: number;
  editedFieldPaths?: string[];
  lastAnalyzedAt?: string;
  lastEditedAt?: string;
  by_section?: Record<string, SectionCompleteness>;
}

// ============================================================================
// 12. COMPREHENSIVE BRAND KIT STRUCTURE (matches DB exactly)
// ============================================================================

export interface ComprehensiveBrandKit {
  meta?: {
    brand_name?: FieldValue<string>;
    canonical_domain?: FieldValue<string>;
    industry?: FieldValue<string>;
    category?: FieldValue<string>;
    primary_language?: FieldValue<string>;
    company_type?: FieldValue<'B2B' | 'B2C' | 'marketplace' | 'SaaS' | 'ecommerce' | 'other'>;
    region?: FieldValue<string>;
    audit_timestamp?: FieldValue<string>;
    data_sources?: FieldValue<{
      onsite: boolean;
      web_search: boolean;
      screenshots: boolean;
      manual: boolean;
    }>;
  };

  visual_identity?: {
    logos?: {
      primary_logo_url?: FieldValue<string>;
      logo_on_light?: FieldValue<string>;
      logo_on_dark?: FieldValue<string>;
      logo_variations?: ArrayField<LogoVariant>;
      favicon_url?: FieldValue<string>;
      logo_rules?: FieldValue<LogoRules>;
    };
    color_system?: {
      primary_colors?: ArrayField<ColorInfo>;
      secondary_colors?: ArrayField<ColorInfo>;
      accent_colors?: ArrayField<ColorInfo>;
      neutrals?: ArrayField<ColorInfo>;
      text_colors?: FieldValue<TextColors>;
      backgrounds?: FieldValue<Backgrounds>;
      gradients?: ArrayField<GradientInfo>;
    };
    typography?: {
      heading_font?: FieldValue<TypographyInfo>;
      body_font?: FieldValue<TypographyInfo>;
      mono_font?: FieldValue<TypographyInfo>;
      accent_font?: FieldValue<TypographyInfo>;
      scale?: FieldValue<TypographyScale>;
    };
    components?: {
      button_style?: FieldValue<ButtonStyle>;
      button_secondary_style?: FieldValue<ButtonStyle>;
      card_style?: FieldValue<CardStyle>;
      card_dark_style?: FieldValue<CardStyle>;
      input_style?: FieldValue<InputStyle>;
      spacing_vibe?: FieldValue<'tight' | 'airy' | 'balanced'>;
      layout_tags?: ArrayField<string>;
    };
    imagery?: {
      style_type?: FieldValue<'photography' | 'illustration' | 'mixed' | '3D'>;
      illustration_style?: FieldValue<'flat' | 'gradient' | '3D' | 'isometric' | 'hand-drawn' | 'other'>;
      icon_style?: FieldValue<'outline' | 'filled' | 'duotone' | 'gradient'>;
      sample_images?: ArrayField<string>;
      style_description?: FieldValue<string>;
    };
  };

  verbal_identity?: {
    tagline?: FieldValue<string>;
    elevator_pitch?: FieldValue<string>;
    value_proposition?: FieldValue<string>;
    core_value_props?: ArrayField<string>;
    brand_story?: FieldValue<string>;
    tone_of_voice?: ToneOfVoice;
    brand_personality?: FieldValue<string>;
    key_phrases?: ArrayField<string>;
    words_to_avoid?: ArrayField<string>;
    brand_words?: ArrayField<string>;
    messaging_pillars?: ArrayField<string>;
  };

  audience_positioning?: {
    primary_icp?: FieldValue<ICPInfo>;
    secondary_icps?: ArrayField<ICPInfo>;
    problems_solved?: ArrayField<string>;
    benefits_promised?: ArrayField<string>;
    category?: FieldValue<string>;
    positioning_statement?: FieldValue<string>;
  };

  product_offers?: {
    products?: ArrayField<ProductInfo>;
    plans?: {
      plan_names?: ArrayField<PlanInfo>;
      free_trial?: FieldValue<boolean>;
      freemium?: FieldValue<boolean>;
      demo_only?: FieldValue<boolean>;
    };
    key_features?: ArrayField<FeatureGroup>;
    guarantees?: ArrayField<string>;
  };

  proof_trust?: {
    client_logos?: ArrayField<ClientLogo>;
    testimonials?: ArrayField<Testimonial>;
    case_studies?: ArrayField<CaseStudy>;
    third_party_reviews?: ArrayField<Review>;
    awards_certifications?: ArrayField<Award>;
  };

  seo_identity?: {
    canonical_pages?: ArrayField<CanonicalPage>;
    primary_keywords?: ArrayField<string>;
    secondary_keywords?: ArrayField<KeywordGroup>;
    branded_keywords?: ArrayField<string>;
    serp_snapshot?: FieldValue<SerpSnapshot>;
    technical_score?: FieldValue<number>;
  };

  external_presence?: {
    social_profiles?: ArrayField<SocialProfile>;
    directories_marketplaces?: ArrayField<DirectoryListing>;
    other_properties?: ArrayField<OtherProperty>;
  };

  content_assets?: {
    blog_present?: FieldValue<boolean>;
    blog_url?: FieldValue<string>;
    posting_frequency?: FieldValue<string>;
    content_types?: ArrayField<string>;
    estimated_total_assets?: FieldValue<number>;
  };

  competitor_analysis?: {
    keyword_categories?: FieldValue<KeywordCategories>;
    competitors_found?: FieldValue<number>;
    top_competitors?: ArrayField<CompetitorInfo>;
    insights?: {
      market_overview?: FieldValue<string>;
      keyword_opportunities?: ArrayField<KeywordOpportunity>;
      awareness_strategy?: FieldValue<string>;
      competitor_weaknesses?: ArrayField<CompetitorWeakness>;
    };
  };

  contact_info?: {
    company_name?: FieldValue<string>;
    website?: FieldValue<string>;
    email?: FieldValue<string>;
    phone?: FieldValue<string>;
    address?: FieldValue<string>;
    social_links?: ArrayField<SocialLink>;
    footer_text?: FieldValue<string>;
  };

  gaps_summary?: {
    critical_gaps?: GapInfo[];
    inferred_weak?: GapInfo[];
    total_completeness?: number;
    by_section?: Record<string, SectionCompleteness>;
  };
}

// ============================================================================
// 13. DB COLLECTION INTERFACES (matches MongoDB documents exactly)
// ============================================================================

// ----- brand_profiles collection -----
export interface DBBrandProfile {
  _id: string;
  userId: string;
  jobId?: string;

  // Essential info for list views
  name: string | null;
  domain: string;
  url?: string;
  type?: string;
  business_model?: string;
  persona?: string;

  // Denormalized for list display only (source of truth is in brand_kits)
  logo_url?: string;

  // Scores
  scores?: {
    overall: number | null;
    visual_clarity: number | null;
    verbal_clarity: number | null;
    positioning: number | null;
    presence: number | null;
    conversion_trust: number | null;
  };

  // Roadmap tasks embedded for quick access
  roadmap?: {
    tasks: Array<{
      task_id: string;
      title: string;
      description: string;
      category: string;
      effort: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
      priority_score: number;
      status: 'pending' | 'in_progress' | 'completed';
      type: 'quick_win' | 'project' | 'long_term';
    }>;
    quick_wins_count: number;
    projects_count: number;
    long_term_count: number;
    total_count: number;
  };

  // Target audience summary
  target_customer_profile?: {
    role: string | null;
    company_size: string | null;
    industry: string | null;
    pains: string[];
  };

  // Quick flags for filtering
  overall_score?: number;
  completeness_score?: number;
  total_critical_gaps?: number;
  has_social_profiles?: number;
  has_blog?: number;
  has_review_sites?: number;

  // References
  brandKitId?: string;
  socialProfileId?: string;
  jobDocId?: string;

  created_at: string;
  updated_at: string;
}

// ----- brand_kits collection -----
export interface DBBrandKit {
  _id: string;
  userId?: string;
  profileId?: string;
  brandProfileId?: string;
  jobId?: string;
  brand_name?: string;
  domain?: string;

  // Main data - single source of truth
  comprehensive?: ComprehensiveBrandKit;

  // Data quality metrics
  data_quality?: DataQualityMetrics;

  // Visual kit UI config (presentation settings only)
  visual_kit_config?: {
    slides?: SlideConfig[];
    settings?: {
      aspectRatio?: '16:9' | '4:3' | '1:1' | 'A4';
      exportFormat?: 'pdf' | 'png' | 'pptx';
      includePageNumbers?: boolean;
      watermark?: string;
    };
    lastEditedAt?: string;
  };

  // Legacy flat structure (deprecated, for migration)
  visual_identity?: any;
  verbal_identity?: any;
  proof_trust?: any;
  seo?: any;
  content?: any;
  conversion?: any;
  product?: any;

  generated_at?: string;
  created_at: string;
  updated_at: string;
}

// ----- brand_social_profiles collection -----
export interface DBSocialProfileItem {
  platform: string;
  handle?: string | null;
  url?: string | null;
  status: 'found' | 'not_found' | 'manual' | 'reanalysis' | 'verified';
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  verified?: boolean;
  bio?: string | null;
  profile_image_url?: string | null;
  last_post_date?: string | null;
  engagement_rate?: number;
  confidence?: number;
  discovered_at?: string;
  last_checked?: string;
}

export interface DBBrandSocialProfile {
  _id: string;
  brandProfileId: string;
  brandKitId?: string;
  userId: string;
  profiles: DBSocialProfileItem[];
  platforms_found: string[];
  total_found: number;
  total_platforms: number;
  total_followers?: number;
  average_engagement_rate?: number;
  most_active_platform?: string;
  last_activity_date?: string;
  completeness?: number;
  confidence?: number;
  created_at: string;
  updated_at: string;
  last_analyzed_at?: string;
}

// ----- brand_intelligence_jobs collection -----
export interface DBStrengthRisk {
  dimension: string;
  label: string;
  score: number;
  description?: string;
}

export interface DBCriticalGap {
  field: string;
  fieldLabel: string;
  section: string;
  sectionLabel: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
  relatedTaskId?: string;
}

export interface DBSnapshot {
  strengths: DBStrengthRisk[];
  risks: DBStrengthRisk[];
  fieldsFound: number;
  fieldsInferred: number;
  fieldsMissing: number;
  fieldsManual: number;
  totalFields: number;
  overallCompleteness: number;
  sectionCompleteness: Record<string, number>;
  evidenceSummary: {
    sitePages: number;
    screenshots: number;
    searchResults: number;
  };
}

export interface DBDataQuality {
  completeness: number;
  accuracy: number;
  freshness: number;
  overallQuality: number;
  averageConfidence: number;
  sourceBreakdown?: Record<string, number>;
  lowConfidenceFields?: Array<{ field: string; confidence: number }>;
}

export interface DBChannel {
  id: string;
  label: string;
  present: boolean;
  details?: string;
  urls?: string[];
}

export interface DBProgress {
  progress_percentage: number;
  current_phase: string;
  current_phase_label: string;
  phase_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  phase_details?: string;
  current_step: number;
  total_steps: number;
  step_label: string;
  current_task: string;
  sub_progress?: {
    current: number;
    total: number;
    current_name: string;
    current_label?: string;
    modules_completed: string[];
    modules_pending: string[];
  };
  phase_started_at?: string;
  last_updated?: string;
}

export interface DBBrandIntelligenceJob {
  _id: string;
  url: string;
  userId: string;
  status: 'queued' | 'running' | 'complete' | 'failed';
  pipeline: string;

  // Computed fields
  snapshot?: DBSnapshot;
  criticalGaps?: DBCriticalGap[];
  dataQuality?: DBDataQuality;
  scores?: {
    overall: number | null;
    visual_clarity: number | null;
    verbal_clarity: number | null;
    positioning: number | null;
    presence: number | null;
    conversion_trust: number | null;
  };
  brand?: {
    name: string | null;
    domain: string;
    url: string | null;
    logo_url: string | null;
    favicon_url?: string | null;
  };
  roadmap?: {
    quick_wins_count: number;
    projects_count: number;
    long_term_count: number;
    total_count: number;
    completed_count: number;
    completion_percentage: number;
  };
  context?: {
    persona: string | null;
    persona_label: string | null;
    entity_type: string | null;
    business_model: string | null;
    channel_orientation: string | null;
    url: string;
  };
  channels?: DBChannel[];

  // References
  profileId?: string;
  brandKitId?: string;
  socialProfileIds?: string[];

  // Progress
  progress?: DBProgress;

  // Result (legacy)
  result?: {
    profile_id: string;
    brand_kit_id?: string;
    social_profile_ids?: string[];
    tasks_count?: number;
    scores?: any;
    context?: any;
  };

  error?: string | null;
  errorDetails?: any;

  created_at: string;
  started_at?: string;
  completed_at?: string;
  last_updated: string;
}

// ============================================================================
// 14. API RESPONSE TYPES
// ============================================================================

// ----- GET /profiles response -----
export interface ProfileListItem {
  id: string;
  domain: string;
  name: string | null;
  logo_url: string | null;
  persona: string | null;
  overall_score: number | null;
  completeness_score: number;
  created_at: string;
}

export interface ProfilesListResponse {
  profiles: ProfileListItem[];
  total: number;
  limit: number;
  offset: number;
}

// ----- GET /profiles/:id (detail) response -----
export interface ProfileDetailResponse {
  // Profile info (from brand_profiles)
  id: string;
  domain: string;
  name: string | null;
  url: string | null;
  type: string | null;
  business_model: string | null;
  persona: string | null;

  // Scores
  scores: {
    overall: number | null;
    visual_clarity: number | null;
    verbal_clarity: number | null;
    positioning: number | null;
    presence: number | null;
    conversion_trust: number | null;
  };

  // Data quality
  dataQuality: {
    completenessPercentage: number;
    totalFields: number;
    foundFields: number;
    inferredFields: number;
    missingFields: number;
    manualFields: number;
    averageConfidence: number;
    sectionCompleteness: Record<string, number>;
  };

  // Snapshot
  snapshot: {
    strengths: DBStrengthRisk[];
    risks: DBStrengthRisk[];
    criticalGaps: DBCriticalGap[];
  };

  // Channels
  channels: {
    list: DBChannel[];
    summary: string;
  };

  // Brand Kit (from brand_kits.comprehensive)
  brandKit: ComprehensiveBrandKit | null;

  // Social Profiles (from brand_social_profiles)
  socialProfiles: {
    profiles: DBSocialProfileItem[];
    platforms_found: string[];
    total_found: number;
    total_followers: number;
  } | null;

  // Roadmap (from brand_profiles.roadmap)
  roadmap: {
    tasks: Array<{
      task_id: string;
      title: string;
      description: string;
      category: string;
      effort: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
      priority_score: number;
      status: 'pending' | 'in_progress' | 'completed';
      type: 'quick_win' | 'project' | 'long_term';
    }>;
    quick_wins_count: number;
    projects_count: number;
    total_count: number;
    completed_count: number;
    completion_percentage: number;
  };

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ----- GET /jobs/:id response -----
export interface JobDetailResponse {
  id: string;
  url: string;
  status: 'queued' | 'running' | 'complete' | 'failed';
  pipeline: string;

  // Progress (when running)
  progress?: DBProgress;

  // Result (when complete)
  snapshot?: DBSnapshot;
  criticalGaps?: DBCriticalGap[];
  dataQuality?: DBDataQuality;
  scores?: DBBrandIntelligenceJob['scores'];
  brand?: DBBrandIntelligenceJob['brand'];
  roadmap?: DBBrandIntelligenceJob['roadmap'];
  context?: DBBrandIntelligenceJob['context'];
  channels?: DBChannel[];

  // References
  profileId?: string;
  brandKitId?: string;

  // Error (when failed)
  error?: string | null;

  // Timestamps
  created_at: string;
  completed_at?: string;
}

// ============================================================================
// VISUAL KIT UI TYPES (presentation only, not data)
// ============================================================================

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

export interface SlideLayout {
  splitMode: 'full' | 'half-vertical' | 'half-horizontal' | 'thirds';
  darkSide?: 'left' | 'right' | 'top' | 'bottom';
  padding: string;
  gridColumns?: number;
}

export interface SlideDisplayOptions {
  backgroundType?: 'color' | 'gradient' | 'image';
  backgroundValue?: string;
  showClearSpaceDemo?: boolean;
  showProhibitedUsage?: boolean;
  colorDisplayMode?: 'swatches' | 'circles' | 'bars' | 'grid';
  showHexCodes?: boolean;
  showColorNames?: boolean;
  showAccessibility?: boolean;
  showSampleText?: boolean;
  showWeights?: boolean;
  showScale?: boolean;
  sampleTextHeading?: string;
  sampleTextBody?: string;
  showOnLight?: boolean;
  showOnDark?: boolean;
  showButtonStates?: boolean;
  cardDemoTitle?: string;
  cardDemoDescription?: string;
  cardDemoCta?: string;
  buttonLabelPrimary?: string;
  buttonLabelSecondary?: string;
  buttonLabelOutline?: string;
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
  layout: SlideLayout;
  displayOptions?: SlideDisplayOptions;
}

// ============================================================================
// HELPER CONSTANTS
// ============================================================================

export const DIMENSION_LABELS: Record<string, string> = {
  visual_clarity: 'Visual Clarity',
  verbal_clarity: 'Verbal Clarity',
  positioning: 'Positioning',
  presence: 'Online Presence',
  conversion_trust: 'Conversion & Trust',
  overall: 'Overall'
};

export const SECTION_LABELS: Record<string, string> = {
  meta: 'Meta & Audit',
  visual_identity: 'Visual Identity',
  verbal_identity: 'Verbal Identity',
  audience_positioning: 'Audience & Positioning',
  product_offers: 'Product & Offers',
  proof_trust: 'Proof & Trust',
  seo_identity: 'SEO Identity',
  external_presence: 'External Presence',
  content_assets: 'Content Assets',
  competitor_analysis: 'Competitor Analysis',
  contact_info: 'Contact Info'
};
