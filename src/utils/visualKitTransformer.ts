/**
 * UNIFIED BRAND KIT UTILITIES
 * 
 * These utilities work with the single-source-of-truth ComprehensiveBrandKit structure.
 * - Analysis populates fields with status 'found' or 'inferred'
 * - User edits update the SAME fields with status 'manual'
 * - No data duplication between analysis and user edits
 */

import {
  ComprehensiveBrandKit,
  BrandKitField,
  BrandKitArrayField,
  VisualKitUIConfig,
  SlideConfig,
  DEFAULT_SLIDES,
  DataQualityMetrics,
  createFoundField,
  createInferredField,
  createMissingField,
  createFoundArrayField,
  createMissingArrayField,
  updateFieldWithEdit,
  calculateDataQuality,
  ColorInfo,
  TypographyInfo,
  ButtonStyleInfo,
  CardStyleInfo,
} from '../types/brandKit';

// ============================================
// DEFAULT VALUES FOR INFERRED FIELDS
// ============================================

const DEFAULT_BACKGROUNDS = {
  light: '#FFFFFF',
  dark: '#0F172A',
  surface: '#F8FAFC',
};

const DEFAULT_TEXT_COLORS = {
  on_light: [
    { hex: '#1E293B', name: 'Primary Text', role: 'text', usage: ['headings', 'body'] },
    { hex: '#64748B', name: 'Secondary Text', role: 'text', usage: ['captions', 'muted'] },
  ],
  on_dark: [
    { hex: '#F8FAFC', name: 'Primary Text', role: 'text', usage: ['headings', 'body'] },
    { hex: '#94A3B8', name: 'Secondary Text', role: 'text', usage: ['captions', 'muted'] },
  ],
};

const DEFAULT_TYPOGRAPHY_SCALE = {
  baseSize: 16,
  scaleRatio: 1.25,
  lineHeight: { heading: 1.2, body: 1.6 },
  letterSpacing: { heading: '-0.02em', body: '0', caps: '0.08em' },
};

const DEFAULT_LOGO_RULES = {
  clearSpaceMultiplier: 1.5,
  minDisplaySize: '80px',
  prohibitedUsage: [
    'Do not rotate or skew',
    'Do not change the logo colors',
    'Do not add effects or shadows',
    'Do not place on busy backgrounds',
  ],
};

// ============================================
// ENSURE COMPREHENSIVE STRUCTURE
// ============================================

/**
 * Ensures a comprehensive brand kit has all required sections with proper defaults.
 * Fills in missing sections and fields without overwriting existing data.
 */
export function ensureComprehensiveStructure(
  existing: Partial<ComprehensiveBrandKit> | null | undefined,
  brandName: string = 'Brand',
  domain: string = 'example.com'
): ComprehensiveBrandKit {
  const kit = existing || {};
  
  return {
    meta: ensureMetaSection(kit.meta, brandName, domain),
    visual_identity: ensureVisualIdentitySection(kit.visual_identity),
    verbal_identity: ensureVerbalIdentitySection(kit.verbal_identity),
    audience_positioning: ensureAudiencePositioningSection(kit.audience_positioning),
    product_offers: ensureProductOffersSection(kit.product_offers),
    proof_trust: ensureProofTrustSection(kit.proof_trust),
    seo_identity: ensureSeoIdentitySection(kit.seo_identity),
    external_presence: ensureExternalPresenceSection(kit.external_presence),
    content_assets: ensureContentAssetsSection(kit.content_assets),
    competitor_analysis: ensureCompetitorAnalysisSection(kit.competitor_analysis),
    contact_info: ensureContactInfoSection(kit.contact_info, brandName, domain),
    gaps_summary: kit.gaps_summary || {
      critical_gaps: [],
      inferred_weak: [],
      total_completeness: 0,
      by_section: {},
    },
  };
}

function ensureMetaSection(meta: any, brandName: string, domain: string) {
  return {
    brand_name: meta?.brand_name || createFoundField(brandName, 'Brand name', ['everywhere'], [domain]),
    canonical_domain: meta?.canonical_domain || createFoundField(domain, 'Primary domain', ['everywhere'], [domain]),
    industry: meta?.industry || createMissingField('Industry classification', ['targeting', 'content']),
    category: meta?.category || createMissingField('Business category', ['targeting']),
    primary_language: meta?.primary_language || createInferredField('en', 'Primary language', ['content'], 0.9, 'Inferred from website'),
    company_type: meta?.company_type || createMissingField('Company type (B2B, B2C, SaaS)', ['targeting']),
    region: meta?.region || createMissingField('Primary region', ['targeting']),
    audit_timestamp: meta?.audit_timestamp || createFoundField(new Date().toISOString(), 'Analysis timestamp', ['audit'], ['system']),
    data_sources: meta?.data_sources || createFoundField({ onsite: true, web_search: false, screenshots: false, manual: false }, 'Data sources used', ['audit'], ['system']),
  };
}

function ensureVisualIdentitySection(vi: any) {
  const primaryColor = vi?.color_system?.primary_colors?.items?.[0]?.hex || '#3B82F6';
  
  return {
    logos: {
      primary_logo_url: vi?.logos?.primary_logo_url || createMissingField('Primary logo URL', ['slides', 'header']),
      logo_on_light: vi?.logos?.logo_on_light || createMissingField('Logo for light backgrounds', ['slides']),
      logo_on_dark: vi?.logos?.logo_on_dark || createMissingField('Logo for dark backgrounds', ['slides']),
      logo_variations: vi?.logos?.logo_variations || createMissingArrayField('Logo variations', ['brand-kit']),
      favicon_url: vi?.logos?.favicon_url || createMissingField('Favicon URL', ['browser']),
      logo_rules: vi?.logos?.logo_rules || createInferredField(DEFAULT_LOGO_RULES, 'Logo usage rules', ['brand-kit'], 0.6, 'Standard logo guidelines'),
    },
    color_system: {
      primary_colors: vi?.color_system?.primary_colors || createMissingArrayField('Primary brand colors', ['buttons', 'links', 'cta']),
      secondary_colors: vi?.color_system?.secondary_colors || createMissingArrayField('Secondary brand colors', ['accents', 'highlights']),
      accent_colors: vi?.color_system?.accent_colors || createMissingArrayField('Accent colors', ['highlights', 'alerts']),
      neutrals: vi?.color_system?.neutrals || createInferredField([
        { hex: '#F8FAFC', name: 'Light Gray', role: 'neutral', usage: ['backgrounds'] },
        { hex: '#64748B', name: 'Slate', role: 'neutral', usage: ['text', 'borders'] },
        { hex: '#1E293B', name: 'Dark Slate', role: 'neutral', usage: ['text', 'backgrounds'] },
      ] as ColorInfo[], 'Neutral colors', ['backgrounds', 'text'], 0.8, 'Standard neutral palette'),
      text_colors: vi?.color_system?.text_colors || createInferredField(DEFAULT_TEXT_COLORS, 'Text colors', ['typography'], 0.8, 'Standard text colors'),
      backgrounds: vi?.color_system?.backgrounds || createInferredField(DEFAULT_BACKGROUNDS, 'Background colors', ['layouts'], 0.8, 'Standard backgrounds'),
      gradients: vi?.color_system?.gradients || createMissingArrayField('Brand gradients', ['backgrounds', 'effects']),
    },
    typography: {
      heading_font: vi?.typography?.heading_font || createMissingField<TypographyInfo>('Heading font', ['headings', 'titles']),
      body_font: vi?.typography?.body_font || createMissingField<TypographyInfo>('Body font', ['paragraphs', 'content']),
      mono_font: vi?.typography?.mono_font || createInferredField<TypographyInfo>({ name: 'JetBrains Mono', fallbacks: ['monospace'], style: 'monospace' }, 'Monospace font', ['code'], 0.5, 'Standard mono font'),
      accent_font: vi?.typography?.accent_font || createMissingField<TypographyInfo>('Accent/display font', ['special']),
      scale: vi?.typography?.scale || createInferredField(DEFAULT_TYPOGRAPHY_SCALE, 'Typography scale', ['all-text'], 0.7, 'Standard Major Third scale'),
    },
    components: {
      button_style: vi?.components?.button_style || createInferredField<ButtonStyleInfo>({
        borderRadius: '8px',
        padding: '12px 24px',
        fontWeight: 600,
        textTransform: 'none',
        states: {
          default: { bg: primaryColor, text: '#FFFFFF', border: 'none' },
          hover: { bg: darkenColor(primaryColor, 10), text: '#FFFFFF', border: 'none' },
          disabled: { bg: '#94A3B8', text: '#FFFFFF', border: 'none' },
        },
      }, 'Primary button style', ['cta', 'forms'], 0.6, 'Inferred from primary color'),
      button_secondary_style: vi?.components?.button_secondary_style || createInferredField<ButtonStyleInfo>({
        borderRadius: '8px',
        padding: '12px 24px',
        fontWeight: 600,
        textTransform: 'none',
        states: {
          default: { bg: 'transparent', text: primaryColor, border: `2px solid ${primaryColor}` },
          hover: { bg: primaryColor, text: '#FFFFFF', border: `2px solid ${primaryColor}` },
          disabled: { bg: 'transparent', text: '#94A3B8', border: '2px solid #94A3B8' },
        },
      }, 'Secondary button style', ['secondary-cta'], 0.6, 'Outline variant'),
      card_style: vi?.components?.card_style || createInferredField<CardStyleInfo>({
        borderRadius: '12px',
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: 'none',
        padding: '24px',
        background: '#FFFFFF',
      }, 'Card style on light background', ['cards', 'panels'], 0.6, 'Standard card style'),
      card_dark_style: vi?.components?.card_dark_style || createInferredField<CardStyleInfo>({
        borderRadius: '12px',
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '24px',
        background: '#1E293B',
      }, 'Card style on dark background', ['cards', 'panels'], 0.6, 'Dark mode card'),
      input_style: vi?.components?.input_style || createInferredField({
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        focusRing: `0 0 0 3px ${primaryColor}33`,
        background: '#FFFFFF',
      }, 'Input field style', ['forms'], 0.6, 'Standard input style'),
      spacing_vibe: vi?.components?.spacing_vibe || createMissingField('Spacing style', ['layouts']),
      layout_tags: vi?.components?.layout_tags || createMissingArrayField('Layout style tags', ['design']),
    },
    imagery: {
      style_type: vi?.imagery?.style_type || createMissingField('Imagery style type', ['content']),
      illustration_style: vi?.imagery?.illustration_style || createMissingField('Illustration style', ['graphics']),
      icon_style: vi?.imagery?.icon_style || createMissingField('Icon style', ['ui']),
      sample_images: vi?.imagery?.sample_images || createMissingArrayField('Sample brand images', ['reference']),
      style_description: vi?.imagery?.style_description || createMissingField('Imagery style description', ['guidelines']),
    },
  };
}

function ensureVerbalIdentitySection(verbal: any) {
  return {
    tagline: verbal?.tagline || createMissingField('Brand tagline', ['hero', 'marketing']),
    elevator_pitch: verbal?.elevator_pitch || createMissingField('Elevator pitch', ['about', 'marketing']),
    core_value_props: verbal?.core_value_props || createMissingArrayField('Core value propositions', ['marketing']),
    tone_of_voice: {
      adjectives: verbal?.tone_of_voice?.adjectives || createMissingArrayField('Tone adjectives', ['content']),
      guidance: verbal?.tone_of_voice?.guidance || createMissingField('Voice guidance', ['content']),
    },
    brand_personality: verbal?.brand_personality || createMissingField('Brand personality', ['content']),
    key_phrases: verbal?.key_phrases || createMissingArrayField('Key brand phrases', ['marketing']),
    words_to_avoid: verbal?.words_to_avoid || createMissingArrayField('Words to avoid', ['content']),
    brand_words: verbal?.brand_words || createMissingArrayField('Brand vocabulary', ['content']),
    messaging_pillars: verbal?.messaging_pillars || createMissingArrayField('Messaging pillars', ['content-strategy']),
  };
}

function ensureAudiencePositioningSection(ap: any) {
  return {
    primary_icp: ap?.primary_icp || createMissingField('Primary ICP', ['targeting']),
    secondary_icps: ap?.secondary_icps || createMissingArrayField('Secondary ICPs', ['targeting']),
    problems_solved: ap?.problems_solved || createMissingArrayField('Problems solved', ['messaging']),
    benefits_promised: ap?.benefits_promised || createMissingArrayField('Benefits promised', ['messaging']),
    category: ap?.category || createMissingField('Market category', ['positioning']),
    positioning_statement: ap?.positioning_statement || createMissingField('Positioning statement', ['strategy']),
  };
}

function ensureProductOffersSection(po: any) {
  return {
    products: po?.products || createMissingArrayField('Products', ['offerings']),
    plans: {
      plan_names: po?.plans?.plan_names || createMissingArrayField('Plan names', ['pricing']),
      free_trial: po?.plans?.free_trial || createMissingField('Free trial available', ['pricing']),
      freemium: po?.plans?.freemium || createMissingField('Freemium option', ['pricing']),
      demo_only: po?.plans?.demo_only || createMissingField('Demo only', ['pricing']),
    },
    key_features: po?.key_features || createMissingArrayField('Key features', ['product']),
    guarantees: po?.guarantees || createMissingArrayField('Guarantees', ['trust']),
  };
}

function ensureProofTrustSection(pt: any) {
  return {
    client_logos: pt?.client_logos || createMissingArrayField('Client logos', ['social-proof']),
    testimonials: pt?.testimonials || createMissingArrayField('Testimonials', ['social-proof']),
    case_studies: pt?.case_studies || createMissingArrayField('Case studies', ['social-proof']),
    third_party_reviews: pt?.third_party_reviews || createMissingArrayField('Third-party reviews', ['social-proof']),
    awards_certifications: pt?.awards_certifications || createMissingArrayField('Awards & certifications', ['trust']),
  };
}

function ensureSeoIdentitySection(seo: any) {
  return {
    canonical_pages: seo?.canonical_pages || createMissingArrayField('Canonical pages', ['seo']),
    primary_keywords: seo?.primary_keywords || createMissingArrayField('Primary keywords', ['seo']),
    secondary_keywords: seo?.secondary_keywords || createMissingArrayField('Secondary keywords', ['seo']),
    branded_keywords: seo?.branded_keywords || createMissingArrayField('Branded keywords', ['seo']),
    serp_snapshot: seo?.serp_snapshot || createMissingField('SERP snapshot', ['seo']),
  };
}

function ensureExternalPresenceSection(ep: any) {
  return {
    social_profiles: ep?.social_profiles || createMissingArrayField('Social profiles', ['presence']),
    directories_marketplaces: ep?.directories_marketplaces || createMissingArrayField('Directories & marketplaces', ['presence']),
    other_properties: ep?.other_properties || createMissingArrayField('Other properties', ['presence']),
  };
}

function ensureContentAssetsSection(ca: any) {
  return {
    blog_present: ca?.blog_present || createMissingField('Blog present', ['content']),
    posting_frequency: ca?.posting_frequency || createMissingField('Posting frequency', ['content']),
    content_types: ca?.content_types || createMissingArrayField('Content types', ['content']),
    estimated_total_assets: ca?.estimated_total_assets || createMissingField('Total assets', ['content']),
  };
}

function ensureCompetitorAnalysisSection(comp: any) {
  return {
    keyword_categories: comp?.keyword_categories || createMissingField('Keyword categories', ['seo']),
    competitors_found: comp?.competitors_found || createMissingField('Competitors found', ['competitive']),
    top_competitors: comp?.top_competitors || createMissingArrayField('Top competitors', ['competitive']),
    insights: {
      market_overview: comp?.insights?.market_overview || createMissingField('Market overview', ['strategy']),
      keyword_opportunities: comp?.insights?.keyword_opportunities || createMissingArrayField('Keyword opportunities', ['seo']),
      awareness_strategy: comp?.insights?.awareness_strategy || createMissingField('Awareness strategy', ['strategy']),
      competitor_weaknesses: comp?.insights?.competitor_weaknesses || createMissingArrayField('Competitor weaknesses', ['competitive']),
    },
  };
}

function ensureContactInfoSection(contact: any, brandName: string, domain: string) {
  return {
    company_name: contact?.company_name || createFoundField(brandName, 'Company name', ['contact'], [domain]),
    website: contact?.website || createFoundField(`https://${domain}`, 'Website URL', ['contact'], [domain]),
    email: contact?.email || createMissingField('Contact email', ['contact']),
    phone: contact?.phone || createMissingField('Phone number', ['contact']),
    address: contact?.address || createMissingField('Address', ['contact']),
    social_links: contact?.social_links || createMissingArrayField('Social links', ['contact']),
    footer_text: contact?.footer_text || createInferredField(`© ${new Date().getFullYear()} ${brandName}`, 'Footer text', ['footer'], 0.9, 'Generated footer'),
  };
}

// ============================================
// UPDATE FIELD WITH EDIT
// ============================================

/**
 * Update a field in the comprehensive structure with a user edit.
 * Preserves originalValue for reset capability.
 */
export function applyFieldEdit<T>(
  field: BrandKitField<T>,
  newValue: T
): BrandKitField<T> {
  return updateFieldWithEdit(field, newValue);
}

/**
 * Apply a deep path update to the comprehensive structure.
 * Path format: "visual_identity.color_system.primary_colors.items[0].hex"
 */
export function applyDeepUpdate(
  comprehensive: ComprehensiveBrandKit,
  path: string,
  value: any
): { updated: ComprehensiveBrandKit; fieldPath: string } {
  const parts = path.split(/\.|\[|\]/).filter(Boolean);
  const clone = JSON.parse(JSON.stringify(comprehensive));
  
  let current: any = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (current[key] === undefined) {
      // Create intermediate structure
      const nextKey = parts[i + 1];
      current[key] = /^\d+$/.test(nextKey) ? [] : {};
    }
    current = current[key];
  }
  
  const lastKey = parts[parts.length - 1];
  
  // If updating a BrandKitField, properly track the edit
  if (current[lastKey] && typeof current[lastKey] === 'object' && 'status' in current[lastKey]) {
    current[lastKey] = updateFieldWithEdit(current[lastKey], value);
  } else {
    current[lastKey] = value;
  }
  
  return { updated: clone, fieldPath: path };
}

// ============================================
// VISUAL KIT UI CONFIG
// ============================================

/**
 * Get or create visual kit UI configuration.
 * This only contains slide layouts and display settings, NOT brand data.
 */
export function getDefaultVisualKitConfig(): VisualKitUIConfig {
  return {
    slides: JSON.parse(JSON.stringify(DEFAULT_SLIDES)),
    settings: {
      aspectRatio: '16:9',
      exportFormat: 'pdf',
      includePageNumbers: true,
    },
  };
}

/**
 * Merge user's visual kit config with defaults.
 */
export function ensureVisualKitConfig(
  existing: Partial<VisualKitUIConfig> | null | undefined
): VisualKitUIConfig {
  const defaults = getDefaultVisualKitConfig();
  
  if (!existing) {
    return defaults;
  }
  
  return {
    slides: existing.slides || defaults.slides,
    settings: {
      ...defaults.settings,
      ...existing.settings,
    },
    lastEditedAt: existing.lastEditedAt,
  };
}

// ============================================
// UTILITIES
// ============================================

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/**
 * Get field by dot-notation path from comprehensive structure.
 */
export function getFieldByPath(comprehensive: ComprehensiveBrandKit, path: string): any {
  const parts = path.split(/\.|\[|\]/).filter(Boolean);
  let current: any = comprehensive;
  
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  
  return current;
}

/**
 * List all editable field paths in the comprehensive structure.
 */
export function listEditableFieldPaths(comprehensive: ComprehensiveBrandKit): string[] {
  const paths: string[] = [];
  
  function traverse(obj: any, currentPath: string) {
    if (obj && typeof obj === 'object') {
      if ('status' in obj && 'confidence' in obj) {
        // This is a BrandKitField - add to paths
        paths.push(currentPath);
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          traverse(item, `${currentPath}[${index}]`);
        });
      } else {
        Object.entries(obj).forEach(([key, value]) => {
          traverse(value, currentPath ? `${currentPath}.${key}` : key);
        });
      }
    }
  }
  
  traverse(comprehensive, '');
  return paths;
}
