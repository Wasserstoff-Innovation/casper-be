import {
  ComprehensiveBrandKit,
  createFoundField,
  createMissingField,
  createFoundArrayField,
  createMissingArrayField,
  BrandKitField,
  BrandKitArrayField,
  LogoVariantInfo,
} from '../types/brandKit';

/**
 * Helper functions to build brand kit fields manually
 */
export class ManualBrandKitBuilder {
  
  /**
   * Creates a minimal brand kit with only required fields
   */
  static createMinimalBrandKit(input: {
    brand_name: string;
    canonical_domain: string;
    primary_logo_url: string;
    primary_colors: Array<{ hex: string; role?: string; usage?: string[] }>;
    tagline: string;
  }): Partial<ComprehensiveBrandKit> {
    return {
      meta: {
        brand_name: createFoundField(
          input.brand_name,
          'Official brand name',
          ['all_communications', 'legal', 'marketing'],
          ['manual'],
          1.0
        ),
        canonical_domain: createFoundField(
          input.canonical_domain,
          'Primary website domain',
          ['web_presence', 'email', 'links'],
          ['manual'],
          1.0
        ),
        industry: createMissingField('Primary industry or vertical', ['positioning', 'targeting']),
        category: createMissingField('Product/service category', ['positioning', 'SEO']),
        primary_language: createFoundField('English', 'Primary language used', ['content', 'localization'], ['manual'], 1.0),
        company_type: createMissingField('Business model type', ['positioning', 'targeting']),
        region: createMissingField('Primary geographic region or market', ['localization', 'targeting']),
        audit_timestamp: createFoundField(
          new Date().toISOString(),
          'When this brand kit was generated',
          ['meta', 'freshness'],
          ['system'],
          1.0
        ),
        data_sources: createFoundField(
          { onsite: false, web_search: false, screenshots: false, manual: true },
          'Data collection methods used',
          ['meta', 'confidence_scoring'],
          ['system'],
          1.0
        ),
      },
      visual_identity: {
        logos: {
          primary_logo_url: createFoundField(
            input.primary_logo_url,
            'Main brand logo',
            ['header', 'footer', 'marketing'],
            ['manual'],
            1.0
          ),
          logo_variations: createMissingArrayField<LogoVariantInfo>('Logo variations', ['responsive_design']),
          favicon_url: createMissingField('Browser favicon', ['web_presence']),
        },
        color_system: {
          primary_colors: createFoundArrayField(
            input.primary_colors.map(c => ({
              hex: c.hex,
              role: c.role || 'primary',
              usage: c.usage || ['buttons', 'links', 'brand_elements'],
            })),
            'Main brand colors',
            ['design_system', 'brand_guidelines'],
            ['manual'],
            1.0
          ),
          secondary_colors: createMissingArrayField<any>('Secondary brand colors', ['design_system']),
          accent_colors: createMissingArrayField<any>('Accent colors', ['design_system']),
          neutrals: createMissingArrayField<any>('Neutral colors', ['design_system']),
        },
        typography: {
          heading_font: createMissingField('Font used for headings', ['design_system']),
          body_font: createMissingField('Font used for body text', ['design_system']),
          mono_font: createMissingField('Monospace font', ['documentation']),
        },
        components: {
          button_style: createMissingField('CTA button styling', ['design_system']),
          card_style: createMissingField('Card component styling', ['design_system']),
          spacing_vibe: createMissingField('Overall spacing approach', ['design_system']),
          layout_tags: createMissingArrayField<string>('Common layout patterns', ['design_system']),
        },
        imagery: {
          style_type: createMissingField('Visual content style', ['brand_guidelines']),
          illustration_style: createMissingField('Illustration art style', ['brand_guidelines']),
          icon_style: createMissingField('Icon design style', ['design_system']),
        },
      },
      verbal_identity: {
        tagline: createFoundField(
          input.tagline,
          'Brand tagline or slogan',
          ['homepage_hero', 'social_bio', 'marketing'],
          ['manual'],
          1.0
        ),
        elevator_pitch: createMissingField('1-3 sentence description', ['about_page']),
        core_value_props: createMissingArrayField<string>('Core benefit statements', ['homepage']),
        tone_of_voice: {
          adjectives: createMissingArrayField<string>('Tone descriptors', ['brand_guidelines']),
          guidance: createMissingField('Copywriting guidelines', ['content_creation']),
        },
        brand_personality: createMissingField('Brand personality', ['brand_strategy']),
        key_phrases: createMissingArrayField<string>('Repeated phrases', ['messaging']),
        words_to_avoid: createMissingArrayField<string>('Terms to avoid', ['brand_guidelines']),
      },
      // ... other sections will be all missing for minimal
    };
  }

  /**
   * Creates a field with manual status
   */
  static createManualField<T>(
    value: T,
    description: string,
    usage: string[],
    notes?: string
  ): BrandKitField<T> {
    return {
      value,
      status: 'manual',
      confidence: 1.0,
      description,
      usage,
      source: ['manual'],
      notes: notes || null,
    };
  }

  /**
   * Creates an array field with manual status
   */
  static createManualArrayField<T>(
    items: T[],
    description: string,
    usage: string[],
    notes?: string
  ): BrandKitArrayField<T> {
    return {
      items,
      status: 'manual',
      confidence: 1.0,
      description,
      usage,
      source: ['manual'],
      notes: notes || null,
    };
  }

  /**
   * Builds a complete brand kit from user input
   * All provided fields will be marked as 'manual' with 1.0 confidence
   */
  static buildFromUserInput(input: ManualBrandKitInput): ComprehensiveBrandKit {
    // This will be a comprehensive builder that takes user input
    // and creates a full brand kit structure
    // For now, return a structure with all fields
    return {} as ComprehensiveBrandKit; // Placeholder - will implement full builder
  }
}

/**
 * Input interface for manual brand kit creation
 */
export interface ManualBrandKitInput {
  // Meta
  brand_name: string;
  canonical_domain: string;
  industry?: string;
  category?: string;
  company_type?: 'B2B' | 'B2C' | 'marketplace' | 'SaaS' | 'ecommerce' | 'other';
  region?: string;
  primary_language?: string;

  // Visual Identity
  primary_logo_url?: string;
  logo_variations?: Array<{ type: string; url: string }>;
  favicon_url?: string;
  primary_colors?: Array<{ hex: string; role?: string; usage?: string[] }>;
  secondary_colors?: Array<{ hex: string; role?: string; usage?: string[] }>;
  heading_font?: { name: string; fallbacks?: string[]; style_notes?: string };
  body_font?: { name: string; fallbacks?: string[] };

  // Verbal Identity
  tagline?: string;
  elevator_pitch?: string;
  core_value_props?: string[];
  tone_adjectives?: string[];
  tone_guidance?: string;
  brand_personality?: string;
  key_phrases?: string[];
  words_to_avoid?: string[];

  // Audience & Positioning
  primary_icp?: {
    role: string;
    company_type: string;
    company_size: string;
  };
  problems_solved?: string[];
  benefits_promised?: string[];
  positioning_statement?: string;

  // Product & Offers
  products?: Array<{ name: string; description: string }>;
  plans?: Array<{ name: string; pricing_notes?: string }>;
  free_trial?: boolean;
  freemium?: boolean;
  key_features?: Array<{ theme: string; features: string[] }>;
  guarantees?: string[];

  // Proof & Trust
  client_logos?: Array<{ name: string; logo_url?: string }>;
  testimonials?: Array<{ quote: string; name?: string; role?: string; company?: string }>;
  case_studies?: Array<{ title: string; customer?: string; industry?: string; outcomes?: string[] }>;
  review_sites?: Array<{ platform: string; url: string; rating?: number }>;
  awards?: Array<{ name: string; badge_url?: string }>;

  // SEO
  primary_keywords?: string[];
  canonical_pages?: Array<{ type: string; url: string }>;

  // External Presence
  social_profiles?: Array<{ platform: string; url: string; followers?: number }>;
  other_properties?: Array<{ type: string; url: string; description?: string }>;
}

