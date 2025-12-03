import {
  ComprehensiveBrandKit,
  createFoundField,
  createInferredField,
  createMissingField,
  createFoundArrayField,
  createMissingArrayField,
  calculateSectionCompleteness,
  GapInfo,
  LogoVariantInfo,
  GradientInfo,
} from '../types/brandKit';

/**
 * Transforms v2 brand intelligence data into comprehensive brand kit format
 */
export class BrandKitTransformer {
  
  static transformV2ToBrandKit(v2Data: any, domain: string): ComprehensiveBrandKit {
    const brand_kit = v2Data.brand_kit || {};
    const brand_scores = v2Data.brand_scores || {};
    const brand_roadmap = v2Data.brand_roadmap || {};
    const evidence_sources = brand_kit.evidence_sources || {};
    
    // competitor_analysis might be in brand_kit or at top level
    const competitor_analysis = brand_kit.competitor_analysis || v2Data.competitor_analysis || {};

    const brandKit: ComprehensiveBrandKit = {
      meta: this.buildMeta(brand_kit, domain, evidence_sources),
      visual_identity: this.buildVisualIdentity(brand_kit),
      verbal_identity: this.buildVerbalIdentity(brand_kit),
      audience_positioning: this.buildAudiencePositioning(brand_kit),
      product_offers: this.buildProductOffers(brand_kit),
      proof_trust: this.buildProofTrust(brand_kit),
      seo_identity: this.buildSEOIdentity(brand_kit),
      external_presence: this.buildExternalPresence(brand_kit),
      content_assets: this.buildContentAssets(brand_kit),
      competitor_analysis: this.buildCompetitorAnalysis({ ...brand_kit, competitor_analysis }),
      contact_info: this.buildContactInfo(brand_kit, domain),
      gaps_summary: {} as any, // Will be populated after
    };

    // Calculate gaps after building all sections
    brandKit.gaps_summary = this.buildGapsSummary(brandKit);

    return brandKit;
  }

  private static buildMeta(brand_kit: any, domain: string, evidence_sources: any) {
    return {
      brand_name: createFoundField(
        brand_kit.brand_name || 'Unknown Brand',
        'Official brand name',
        ['all_communications', 'legal', 'marketing'],
        [domain],
        brand_kit.brand_name ? 1.0 : 0.5
      ),
      canonical_domain: createFoundField(
        domain,
        'Primary website domain',
        ['web_presence', 'email', 'links'],
        [domain],
        1.0
      ),
      industry: brand_kit.positioning?.industry 
        ? createFoundField(
            brand_kit.positioning.industry,
            'Primary industry or vertical',
            ['positioning', 'targeting', 'messaging'],
            [domain],
            0.8,
            'Inferred from site content'
          )
        : createMissingField('Primary industry or vertical', ['positioning', 'targeting'], 'Not clearly stated on site'),
      category: brand_kit.positioning?.category
        ? createFoundField(
            brand_kit.positioning.category,
            'Product/service category',
            ['positioning', 'SEO', 'comparisons'],
            [domain],
            0.9
          )
        : createMissingField('Product/service category', ['positioning', 'SEO']),
      primary_language: createInferredField(
        'English',
        'Primary language used on the website',
        ['content', 'localization'],
        0.95,
        'Detected from site content'
      ),
      company_type: brand_kit.positioning?.company_type
        ? createFoundField(
            brand_kit.positioning.company_type,
            'Business model type',
            ['positioning', 'targeting', 'sales_process'],
            [domain],
            0.8
          )
        : createInferredField(
            'B2B',
            'Business model type',
            ['positioning', 'targeting'],
            0.6,
            'Inferred from audience and content'
          ),
      region: brand_kit.region
        ? createFoundField(
            brand_kit.region,
            'Primary geographic region or market',
            ['localization', 'targeting'],
            [brand_kit.domain],
            0.8,
            'Detected from currency, language, or contact info'
          )
        : createMissingField('Primary geographic region or market', ['localization', 'targeting']),
      audit_timestamp: createFoundField(
        brand_kit.generated_at || new Date().toISOString(),
        'When this brand kit was generated',
        ['meta', 'freshness'],
        ['system'],
        1.0
      ),
      data_sources: createFoundField(
        {
          onsite: true,
          web_search: evidence_sources.web_searches_performed > 0,
          screenshots: evidence_sources.screenshots_captured > 0,
          manual: false,
        },
        'Data collection methods used',
        ['meta', 'confidence_scoring'],
        ['system'],
        1.0
      ),
    };
  }

  private static buildVisualIdentity(brand_kit: any) {
    const visual = brand_kit.visual_identity || {};
    const primaryLogoUrl = visual.logo_url || brand_kit.logos?.primary_url || '';
    
    return {
      logos: {
        primary_logo_url: primaryLogoUrl
          ? createFoundField(
              primaryLogoUrl,
              'Main brand logo',
              ['header', 'footer', 'marketing'],
              [brand_kit.domain],
              1.0
            )
          : createMissingField(
              'Main brand logo',
              ['header', 'footer', 'marketing'],
              'No logo URL extracted'
            ),
        // NEW: logo for light backgrounds (fallback to primary logo)
        logo_on_light: primaryLogoUrl
          ? createInferredField(
              primaryLogoUrl,
              'Logo for light backgrounds',
              ['slides', 'presentations'],
              0.6,
              'Using primary logo as fallback for light backgrounds'
            )
          : createMissingField(
              'Logo for light backgrounds',
              ['slides', 'presentations']
            ),
        // NEW: logo for dark backgrounds (fallback to primary logo)
        logo_on_dark: primaryLogoUrl
          ? createInferredField(
              primaryLogoUrl,
              'Logo for dark backgrounds',
              ['slides', 'presentations'],
              0.6,
              'Using primary logo as fallback for dark backgrounds'
            )
          : createMissingField(
              'Logo for dark backgrounds',
              ['slides', 'presentations']
            ),
        logo_variations: brand_kit.logos?.variations && brand_kit.logos.variations.length > 0
          ? createFoundArrayField<LogoVariantInfo>(
              brand_kit.logos.variations.map((v: any) => ({
                type: (v.type as LogoVariantInfo['type']) || 'primary',
                url: v.url,
                format: v.format,
                aspectRatio: v.aspectRatio,
                minSize: v.minSize,
                clearSpace: v.clearSpace,
              })),
              'Logo variations (dark/light, icon)',
              ['responsive_design', 'social_media'],
              [brand_kit.domain],
              0.9,
              'Extracted from HTML and screenshots'
            )
          : createMissingArrayField<LogoVariantInfo>(
              'Logo variations (dark/light, icon)',
              ['responsive_design', 'social_media']
            ),
        favicon_url: brand_kit.logos?.favicon_url
          ? createFoundField(
              brand_kit.logos.favicon_url,
              'Browser favicon',
              ['web_presence', 'bookmarks'],
              [brand_kit.domain],
              1.0,
              'Extracted from HTML link tags'
            )
          : createMissingField('Browser favicon', ['web_presence', 'bookmarks']),
        // NEW: logo rules
        logo_rules: createInferredField(
          {
            clearSpaceMultiplier: 1.5,
            minDisplaySize: '80px',
            prohibitedUsage: [
              'Do not rotate or skew',
              'Do not change logo colors arbitrarily',
              'Do not place the logo on busy backgrounds',
            ],
          },
          'Logo usage rules',
          ['brand_guidelines', 'slides'],
          0.6,
          'Standard logo guidelines; customize as needed'
        ),
      },
      color_system: {
        primary_colors: visual.primary_colors && visual.primary_colors.length > 0
          ? createFoundArrayField(
              visual.primary_colors.map((c: string) => ({
                hex: c,
                role: 'primary',
                usage: ['buttons', 'links', 'brand_elements'],
              })),
              'Main brand colors',
              ['design_system', 'brand_guidelines'],
              [brand_kit.domain],
              0.9,
              'Extracted from website styling'
            )
          : createMissingArrayField<any>('Main brand colors', ['design_system', 'brand_guidelines']),
        secondary_colors: visual.secondary_colors && visual.secondary_colors.length > 0
          ? createFoundArrayField(
              visual.secondary_colors.map((c: string) => ({
                hex: c,
                role: 'secondary',
                usage: ['accents', 'highlights'],
              })),
              'Secondary brand colors',
              ['design_system'],
              [brand_kit.domain],
              0.8
            )
          : createMissingArrayField<any>('Secondary brand colors', ['design_system']),
        accent_colors: createMissingArrayField<any>(
          'Accent colors for highlights',
          ['design_system']
        ),
        neutrals: createMissingArrayField<any>(
          'Neutral colors (grays, whites)',
          ['design_system', 'backgrounds']
        ),
        // NEW: text colors for light/dark backgrounds
        text_colors: createInferredField(
          {
            on_light: [
              { hex: '#1E293B', name: 'Primary Text', role: 'text', usage: ['headings', 'body'] },
              { hex: '#64748B', name: 'Secondary Text', role: 'text', usage: ['muted'] },
            ],
            on_dark: [
              { hex: '#F9FAFB', name: 'Primary Text (Dark)', role: 'text', usage: ['headings', 'body'] },
              { hex: '#E5E7EB', name: 'Secondary Text (Dark)', role: 'text', usage: ['muted'] },
            ],
          },
          'Text colors on light and dark backgrounds',
          ['typography', 'accessibility'],
          0.7,
          'Standard defaults; override from brand guidelines if available'
        ),
        // NEW: background colors
        backgrounds: createInferredField(
          {
            light: '#FFFFFF',
            dark: '#0F172A',
            surface: '#F8FAFC',
          },
          'Background colors for layouts and cards',
          ['layouts', 'cards'],
          0.7,
          'Standard defaults; override from brand if available'
        ),
        // NEW: gradients
        gradients: createMissingArrayField<GradientInfo>(
          'Brand gradients',
          ['backgrounds', 'effects']
        ),
      },
      typography: {
        heading_font: visual.primary_font
          ? createFoundField(
              { name: visual.primary_font, style_notes: visual.typography_style || '' },
              'Font used for headings',
              ['design_system', 'brand_guidelines'],
              [brand_kit.domain],
              0.9
            )
          : createMissingField('Font used for headings', ['design_system']),
        body_font: visual.secondary_font
          ? createFoundField(
              { name: visual.secondary_font },
              'Font used for body text',
              ['design_system', 'readability'],
              [brand_kit.domain],
              0.8
            )
          : createMissingField('Font used for body text', ['design_system']),
        mono_font: createMissingField(
          'Monospace font for code',
          ['documentation', 'technical_content']
        ),
        // NEW: accent font (display)
        accent_font: createMissingField(
          'Display/accent font',
          ['headlines', 'campaigns']
        ),
        // NEW: typography scale
        scale: createInferredField(
          {
            baseSize: 16,
            scaleRatio: 1.25,
            lineHeight: { heading: 1.2, body: 1.6 },
            letterSpacing: { heading: '-0.02em', body: '0', caps: '0.08em' },
          },
          'Typography scale settings',
          ['design_system'],
          0.7,
          'Standard Major Third scale; adjust manually if needed'
        ),
      },
      components: {
        button_style: visual.button_style
          ? createFoundField(
              { radius: visual.button_style, type: 'filled', shape: 'rounded' },
              'CTA button styling',
              ['design_system', 'conversion'],
              [brand_kit.domain],
              0.7,
              'Inferred from visual analysis'
            )
          : createMissingField('CTA button styling', ['design_system', 'conversion']),
        card_style: createMissingField(
          'Card component styling',
          ['design_system', 'ui_patterns']
        ),
        // NEW: dark card style
        card_dark_style: createInferredField(
          {
            borderRadius: '12px',
            shadow: '0 4px 6px -1px rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(148, 163, 184, 0.5)',
            padding: '24px',
            background: '#0F172A',
          },
          'Card styling on dark backgrounds',
          ['cards', 'dark_mode'],
          0.6,
          'Standard dark card style; customize manually'
        ),
        spacing_vibe: visual.design_style && visual.design_style.includes('minimal')
          ? createInferredField(
              'airy',
              'Overall spacing approach',
              ['design_system'],
              0.6,
              'Inferred from "minimal" style'
            )
          : createMissingField(
              'Overall spacing approach',
              ['design_system']
            ),
        layout_tags: visual.layout_patterns
          ? createFoundArrayField<string>(
              visual.layout_patterns,
              'Common layout patterns used',
              ['design_system', 'responsiveness'],
              [brand_kit.domain],
              0.7
            )
          : createMissingArrayField<string>(
              'Common layout patterns',
              ['design_system']
            ),
        // NEW: secondary button style (outline)
        button_secondary_style: createMissingField(
          'Secondary/outline button style',
          ['design_system', 'secondary_cta']
        ),
        // NEW: input style
        input_style: createInferredField(
          {
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            focusRing: '0 0 0 3px rgba(59,130,246,0.4)',
            background: '#FFFFFF',
          },
          'Input field styling',
          ['forms'],
          0.6,
          'Standard input style; customize from brand if needed'
        ),
      },
      imagery: {
        style_type: visual.imagery_style
          ? createFoundField(
              visual.imagery_style,
              'Visual content style',
              ['brand_guidelines', 'marketing'],
              [brand_kit.domain],
              0.8
            )
          : createMissingField('Visual content style', ['brand_guidelines']),
        illustration_style: createMissingField(
          'Illustration art style',
          ['brand_guidelines', 'marketing']
        ),
        icon_style: createMissingField(
          'Icon design style',
          ['design_system', 'ui']
        ),
        // NEW: sample images
        sample_images: createMissingArrayField<string>(
          'Representative brand imagery',
          ['brand_guidelines', 'moodboard']
        ),
        // NEW: style description
        style_description: createMissingField(
          'Imagery style description',
          ['brand_guidelines'],
          'Describe photography / illustration look & feel here'
        ),
      },
    };
  }

  private static buildVerbalIdentity(brand_kit: any) {
    const voice = brand_kit.voice_and_tone || {};
    
    return {
      tagline: voice.tagline
        ? createFoundField(
            voice.tagline,
            'Brand tagline or slogan',
            ['homepage_hero', 'social_bio', 'marketing'],
            [brand_kit.domain],
            0.9
          )
        : createMissingField('Brand tagline or slogan', ['homepage_hero', 'social_bio'], 'No clear tagline found'),
      elevator_pitch: voice.elevator_pitch
        ? createFoundField(
            voice.elevator_pitch,
            '1-3 sentence description of what you do',
            ['about_page', 'pitch_deck', 'sales'],
            [brand_kit.domain],
            0.85
          )
        : createMissingField('1-3 sentence description', ['about_page', 'pitch_deck']),
      core_value_props: voice.value_propositions && voice.value_propositions.length > 0
        ? createFoundArrayField<string>(
            voice.value_propositions,
            'Core benefit statements',
            ['homepage', 'landing_pages', 'sales'],
            [brand_kit.domain],
            0.8
          )
          : createMissingArrayField<string>('Core benefit statements', ['homepage', 'sales']),
      tone_of_voice: {
        adjectives: voice.tone_adjectives && voice.tone_adjectives.length > 0
          ? createFoundArrayField<string>(
              voice.tone_adjectives,
              'Tone descriptors',
              ['brand_guidelines', 'content_creation'],
              [brand_kit.domain],
              0.75,
              'Inferred from messaging analysis'
            )
          : createMissingArrayField<string>('Tone descriptors', ['brand_guidelines']),
        guidance: voice.tone_guidance
          ? createFoundField(
              voice.tone_guidance,
              'Copywriting guidelines',
              ['content_creation', 'brand_guidelines'],
              [brand_kit.domain],
              0.7,
              'Inferred from content analysis'
            )
          : createMissingField('Copywriting guidelines', ['content_creation']),
      },
      brand_personality: voice.brand_personality
        ? createFoundField(
            voice.brand_personality,
            'Brand personality or archetype',
            ['brand_strategy', 'messaging'],
            [brand_kit.domain],
            0.75
          )
        : createMissingField('Brand personality', ['brand_strategy']),
      key_phrases: voice.key_phrases && voice.key_phrases.length > 0
        ? createFoundArrayField<string>(
            voice.key_phrases,
            'Repeated phrases or mottos',
            ['messaging', 'content'],
            [brand_kit.domain],
            0.8
          )
          : createMissingArrayField<string>(
              'Repeated phrases',
              ['messaging']
            ),
      words_to_avoid: createMissingArrayField<string>(
        'Terms to avoid in brand communications',
        ['brand_guidelines', 'content_creation'],
        'Would need competitor analysis or explicit guidelines'
      ),
      // NEW: brand vocabulary words
      brand_words: createMissingArrayField<string>(
        'Core brand vocabulary words',
        ['brand_guidelines', 'copywriting']
      ),
      // NEW: messaging pillars
      messaging_pillars: createMissingArrayField<string>(
        'Messaging pillars/themes',
        ['content_strategy', 'positioning']
      ),
    };
  }

  private static buildAudiencePositioning(brand_kit: any) {
    const audience = brand_kit.audience || {};
    const positioning = brand_kit.positioning || {};
    
    return {
      primary_icp: audience.primary_audience
        ? createFoundField(
            {
              role: audience.primary_audience.role || 'Unknown',
              company_type: audience.primary_audience.company_type || 'Unknown',
              company_size: audience.primary_audience.company_size || 'Unknown',
            },
            'Primary ideal customer profile',
            ['targeting', 'sales', 'marketing'],
            [brand_kit.domain],
            0.8,
            'Extracted from site messaging'
          )
        : createMissingField('Primary ideal customer profile', ['targeting', 'sales']),
      secondary_icps: audience.secondary_audiences && audience.secondary_audiences.length > 0
        ? createFoundArrayField(
            audience.secondary_audiences.map((a: any) => ({
              role: a.role || 'Unknown',
              company_type: a.company_type || 'Unknown',
              company_size: a.company_size || 'Unknown',
            })),
            'Secondary audience segments',
            ['targeting', 'marketing'],
            [brand_kit.domain],
            0.7
          )
          : createMissingArrayField<any>('Secondary audience segments', ['targeting']),
      problems_solved: audience.pain_points && audience.pain_points.length > 0
        ? createFoundArrayField<string>(
            audience.pain_points,
            'Customer problems addressed',
            ['messaging', 'sales', 'content'],
            [brand_kit.domain],
            0.85
          )
          : createMissingArrayField<string>('Customer problems addressed', ['messaging', 'sales']),
      benefits_promised: audience.goals && audience.goals.length > 0
        ? createFoundArrayField<string>(
            audience.goals,
            'Outcomes customers can expect',
            ['messaging', 'sales', 'marketing'],
            [brand_kit.domain],
            0.8
          )
          : createMissingArrayField<string>('Outcomes promised', ['messaging']),
      category: positioning.category
        ? createFoundField(
            positioning.category,
            'Product/service category',
            ['positioning', 'SEO', 'sales'],
            [brand_kit.domain],
            0.9
          )
        : createMissingField('Product category', ['positioning']),
      positioning_statement: positioning.positioning_statement
        ? createFoundField(
            positioning.positioning_statement,
            'For [who] who [problem], [brand] is a [category] that [benefit]',
            ['brand_strategy', 'sales', 'messaging'],
            [brand_kit.domain],
            0.75,
            'Synthesized from available data'
          )
        : createMissingField('Positioning statement', ['brand_strategy', 'sales']),
    };
  }

  private static buildProductOffers(brand_kit: any) {
    const content = brand_kit.content_strategy || {};
    const pricing = brand_kit.pricing || {};
    const features = brand_kit.features || {};
    
    return {
      products: features.products && features.products.length > 0
        ? createFoundArrayField<any>(
            features.products,
            'Products or service modules',
            ['sales', 'marketing'],
            [brand_kit.domain],
            0.9,
            'Extracted from features/product pages'
          )
        : createMissingArrayField<any>('Products or service modules', ['sales', 'marketing']),
      plans: {
        plan_names: pricing.plans && pricing.plans.length > 0
          ? createFoundArrayField<any>(
              pricing.plans.map((p: any) => ({
                name: p.name || p,
                pricing_notes: p.price || p.pricing_notes,
              })),
              'Pricing plans or tiers',
              ['pricing_page', 'sales'],
              [brand_kit.domain],
              0.95,
              'Extracted from pricing page'
            )
          : createMissingArrayField<any>('Pricing plans or tiers', ['pricing_page', 'sales']),
        free_trial: pricing.free_trial !== undefined
          ? createFoundField(
              pricing.free_trial,
              'Free trial availability',
              ['conversion', 'sales'],
              [brand_kit.domain],
              0.9,
              'Detected from pricing page'
            )
          : createMissingField('Free trial availability', ['conversion', 'sales']),
        freemium: pricing.freemium !== undefined
          ? createFoundField(
              pricing.freemium,
              'Freemium model',
              ['conversion', 'sales'],
              [brand_kit.domain],
              0.9,
              'Detected from pricing structure'
            )
          : createMissingField('Freemium model', ['conversion', 'sales']),
        demo_only: pricing.demo_only !== undefined
          ? createFoundField(
              pricing.demo_only,
              'Demo-only access',
              ['sales'],
              [brand_kit.domain],
              0.9,
              'Detected from CTA buttons'
            )
          : createMissingField('Demo-only access', ['sales']),
      },
      key_features: features.feature_list && features.feature_list.length > 0
        ? createFoundArrayField<any>(
            features.feature_list,
            'Key features by theme',
            ['product_marketing', 'sales'],
            [brand_kit.domain],
            0.85,
            'Extracted from features page'
          )
        : content.content_pillars && content.content_pillars.length > 0
          ? createFoundArrayField<any>(
              content.content_pillars.map((p: string) => ({ theme: p, features: [] })),
              'Key feature themes',
              ['product_marketing', 'sales'],
              [brand_kit.domain],
              0.6,
              'Inferred from content strategy'
            )
          : createMissingArrayField<any>('Key features by theme', ['product_marketing']),
      guarantees: brand_kit.guarantees && brand_kit.guarantees.length > 0
        ? createFoundArrayField<string>(
            brand_kit.guarantees,
            'Money-back guarantees or risk reversals',
            ['conversion', 'trust'],
            [brand_kit.domain],
            0.9,
            'Extracted from footer and pricing page'
          )
        : createMissingArrayField<string>('Money-back guarantees or risk reversals', ['conversion', 'trust']),
    };
  }

  private static buildProofTrust(brand_kit: any) {
    const trust = brand_kit.trust_elements || {};
    const case_studies = brand_kit.case_studies || trust.case_studies || [];
    const review_sites = brand_kit.review_sites || trust.review_sites || [];
    
    return {
      client_logos: trust.client_logos && trust.client_logos.length > 0
        ? createFoundArrayField(
            trust.client_logos.map((name: string) => ({ name, logo_url: undefined })),
            'Notable client logos',
            ['homepage', 'social_proof', 'sales'],
            [brand_kit.domain],
            0.9
          )
        : createMissingArrayField<any>('Client logos', ['social_proof']),
      testimonials: trust.testimonials && trust.testimonials.length > 0
        ? createFoundArrayField(
            trust.testimonials,
            'Customer testimonials',
            ['homepage', 'social_proof', 'sales'],
            [brand_kit.domain],
            0.85
          )
        : createMissingArrayField<any>('Customer testimonials', ['social_proof']),
      case_studies: case_studies.length > 0
        ? createFoundArrayField<any>(
            case_studies.map((cs: any) => ({
              title: cs.title || cs,
              customer: cs.customer,
              industry: cs.industry,
              outcomes: cs.outcomes || [],
              url: cs.url,
            })),
            'Detailed customer success stories',
            ['sales', 'marketing', 'trust'],
            [brand_kit.domain],
            0.9,
            'Extracted from case study pages'
          )
        : createMissingArrayField<any>('Case studies', ['sales', 'trust']),
      third_party_reviews: review_sites.length > 0
        ? createFoundArrayField<any>(
            review_sites.map((site: any) => ({
              platform: site.platform || site.name || site,
              url: site.url || '',
              rating: site.rating,
            })),
            'Third-party review platforms',
            ['trust', 'social_proof'],
            [brand_kit.domain],
            0.95,
            'Discovered from web search and site analysis'
          )
        : createMissingArrayField<any>('Third-party reviews', ['trust']),
      awards_certifications: trust.awards && trust.awards.length > 0
        ? createFoundArrayField<any>(
            trust.awards.map((award: string) => ({ name: award })),
            'Awards, certifications, badges',
            ['trust', 'credibility'],
            [brand_kit.domain],
            0.8
          )
        : createMissingArrayField<any>('Awards and certifications', ['trust']),
    };
  }

  private static buildSEOIdentity(brand_kit: any) {
    const seo = brand_kit.seo_foundation || {};
    
    return {
      canonical_pages: brand_kit.canonical_pages && brand_kit.canonical_pages.length > 0
        ? createFoundArrayField<any>(
            brand_kit.canonical_pages,
            'Main site pages',
            ['site_structure', 'SEO'],
            [brand_kit.domain],
            0.9,
            'Extracted from sitemap and navigation'
          )
        : createMissingArrayField<any>('Main site pages', ['site_structure', 'SEO']),
      primary_keywords: seo.primary_keywords && seo.primary_keywords.length > 0
        ? createFoundArrayField<string>(
            seo.primary_keywords,
            'Core SEO keywords',
            ['SEO', 'content_strategy'],
            [brand_kit.domain],
            0.85
          )
        : createMissingArrayField<string>('Core SEO keywords', ['SEO']),
      secondary_keywords: seo.keyword_themes && seo.keyword_themes.length > 0
        ? createFoundArrayField(
            seo.keyword_themes.map((theme: string) => ({ theme, keywords: [] })),
            'Secondary keyword themes',
            ['SEO', 'content_strategy'],
            [brand_kit.domain],
            0.75
          )
        : createMissingArrayField<any>('Secondary keyword themes', ['SEO']),
      branded_keywords: brand_kit.branded_keywords && brand_kit.branded_keywords.length > 0
        ? createFoundArrayField<string>(
            brand_kit.branded_keywords,
            'Brand-related search terms',
            ['SEO', 'brand_awareness'],
            [brand_kit.domain],
            0.8,
            'Extracted from branded search analysis'
          )
        : createMissingArrayField<string>('Brand-related search terms', ['SEO', 'brand_awareness']),
      serp_snapshot: seo.serp_presence
        ? createFoundField(
            {
              owned_results: seo.serp_presence.owned || [],
              third_party_results: seo.serp_presence.third_party || [],
            },
            'Brand search results overview',
            ['SEO', 'brand_reputation'],
            [brand_kit.domain],
            0.8
          )
        : createMissingField('SERP presence snapshot', ['SEO', 'brand_reputation']),
    };
  }

  private static buildExternalPresence(brand_kit: any) {
    const trust = brand_kit.trust_elements || {};
    const social_profiles = brand_kit.social_profiles || trust.social_profiles || [];
    const review_sites = brand_kit.review_sites || trust.review_sites || [];
    
    return {
      social_profiles: social_profiles.length > 0
        ? createFoundArrayField<any>(
            social_profiles.map((p: any) => ({
              platform: p.platform || p,
              url: p.url || '',
              followers: p.followers,
              handle: p.handle,
            })),
            'Social media presence',
            ['brand_presence', 'marketing'],
            [brand_kit.domain],
            0.95,
            'Extracted from footer and header links'
          )
        : createMissingArrayField<any>('Social media profiles', ['brand_presence']),
      directories_marketplaces: review_sites.length > 0
        ? createFoundArrayField<any>(
            review_sites.map((site: any) => ({
              name: site.platform || site.name || site,
              url: site.url || '',
              rating: site.rating,
            })),
            'Directory and marketplace listings',
            ['trust', 'discovery'],
            [brand_kit.domain],
            0.9,
            'Discovered from web search and site badges'
          )
        : createMissingArrayField<any>('Directory listings', ['trust', 'discovery']),
      other_properties: brand_kit.other_properties && brand_kit.other_properties.length > 0
        ? createFoundArrayField<any>(
            brand_kit.other_properties,
            'Other owned properties (docs, community, etc.)',
            ['brand_presence'],
            [brand_kit.domain],
            0.85,
            'Discovered from subdomain analysis and footer links'
          )
        : createMissingArrayField<any>('Other owned properties (docs, community, etc.)', ['brand_presence']),
    };
  }

  private static buildContentAssets(brand_kit: any) {
    const content = brand_kit.content_strategy || {};
    const content_inventory = brand_kit.content_inventory || {};
    
    return {
      blog_present: content.has_blog !== undefined || content_inventory.blog_posts > 0
        ? createFoundField(
            content.has_blog !== undefined ? content.has_blog : content_inventory.blog_posts > 0,
            'Blog or resource center exists',
            ['content_marketing', 'SEO'],
            [brand_kit.domain],
            1.0
          )
        : createMissingField('Blog presence', ['content_marketing']),
      posting_frequency: content.posting_frequency
        ? createFoundField(
            content.posting_frequency,
            'Content publication cadence',
            ['content_strategy'],
            [brand_kit.domain],
            0.7,
            'Estimated from available content'
          )
        : createMissingField('Content posting frequency', ['content_strategy']),
      content_types: content.content_types && content.content_types.length > 0
        ? createFoundArrayField<string>(
            content.content_types,
            'Types of content published',
            ['content_strategy', 'marketing'],
            [brand_kit.domain],
            0.8
          )
        : createMissingArrayField<string>('Content types', ['content_strategy']),
      estimated_total_assets: content_inventory.total_assets || content_inventory.blog_posts
        ? createFoundField(
            content_inventory.total_assets || 
            (content_inventory.blog_posts + (content_inventory.case_studies || 0) + (content_inventory.guides || 0)),
            'Estimated number of content pieces',
            ['content_inventory'],
            [brand_kit.domain],
            0.85,
            'Calculated from content inventory'
          )
        : createMissingField('Estimated number of content pieces', ['content_inventory']),
    };
  }

  private static buildCompetitorAnalysis(brand_kit: any) {
    const competitor_analysis = brand_kit.competitor_analysis || {};
    
    return {
      keyword_categories: competitor_analysis.keyword_categories
        ? createFoundField(
            competitor_analysis.keyword_categories,
            'Keywords categorized by intent and type',
            ['competitor_analysis', 'seo_strategy'],
            [brand_kit.domain],
            0.9,
            'Categorized from SEO keyword analysis'
          )
        : createMissingField('Keywords categorized by intent', ['competitor_analysis']),
      competitors_found: competitor_analysis.competitors_found !== undefined
        ? createFoundField(
            competitor_analysis.competitors_found,
            'Number of competitors discovered',
            ['competitor_analysis', 'market_research'],
            [brand_kit.domain],
            0.95,
            'Found through keyword overlap analysis'
          )
        : createMissingField('Number of competitors', ['competitor_analysis']),
      top_competitors: competitor_analysis.top_competitors && competitor_analysis.top_competitors.length > 0
        ? createFoundArrayField<any>(
            competitor_analysis.top_competitors,
            'Top competitors ranked by keyword overlap',
            ['competitor_analysis', 'awareness_strategy'],
            [brand_kit.domain],
            0.9,
            'Discovered through keyword-based competitor analysis'
          )
        : createMissingArrayField<any>('Top competitors', ['competitor_analysis']),
      insights: {
        market_overview: competitor_analysis.insights?.market_overview
          ? createFoundField(
              competitor_analysis.insights.market_overview,
              'Overall market landscape and positioning',
              ['strategy', 'positioning'],
              [brand_kit.domain],
              0.85,
              'Generated from competitor analysis'
            )
          : createMissingField('Market overview', ['strategy']),
        keyword_opportunities: competitor_analysis.insights?.keyword_opportunities && competitor_analysis.insights.keyword_opportunities.length > 0
          ? createFoundArrayField<any>(
              competitor_analysis.insights.keyword_opportunities,
              'Keyword opportunities for awareness campaigns',
              ['seo_strategy', 'content_strategy'],
              [brand_kit.domain],
              0.85,
              'Identified through competitor keyword gap analysis'
            )
          : createMissingArrayField<any>('Keyword opportunities', ['seo_strategy']),
        awareness_strategy: competitor_analysis.insights?.awareness_strategy
          ? createFoundField(
              competitor_analysis.insights.awareness_strategy,
              'Recommended awareness campaign strategy',
              ['marketing_strategy', 'awareness'],
              [brand_kit.domain],
              0.8,
              'Generated from competitor positioning analysis'
            )
          : createMissingField('Awareness strategy recommendations', ['marketing_strategy']),
        competitor_weaknesses: competitor_analysis.insights?.competitor_weaknesses && competitor_analysis.insights.competitor_weaknesses.length > 0
          ? createFoundArrayField<any>(
              competitor_analysis.insights.competitor_weaknesses,
              'Identified weaknesses in competitor positioning',
              ['competitive_analysis', 'positioning'],
              [brand_kit.domain],
              0.75,
              'Inferred from competitor analysis'
            )
          : createMissingArrayField<any>('Competitor weaknesses', ['competitive_analysis']),
      },
    };
  }

  private static buildContactInfo(brand_kit: any, domain: string) {
    const contact = brand_kit.contact || {};

    return {
      company_name: createFoundField(
        brand_kit.brand_name || 'Unknown Brand',
        'Company name',
        ['contact', 'footer'],
        [domain],
        brand_kit.brand_name ? 1.0 : 0.5
      ),
      website: createFoundField(
        `https://${domain}`,
        'Website URL',
        ['contact', 'footer'],
        [domain],
        1.0
      ),
      email: contact.email
        ? createFoundField(
            contact.email,
            'Primary contact email',
            ['contact'],
            [domain],
            0.9
          )
        : createMissingField(
            'Primary contact email',
            ['contact']
          ),
      phone: contact.phone
        ? createFoundField(
            contact.phone,
            'Primary contact phone',
            ['contact'],
            [domain],
            0.8
          )
        : createMissingField(
            'Primary contact phone',
            ['contact']
          ),
      address: contact.address
        ? createFoundField(
            contact.address,
            'Company address',
            ['contact'],
            [domain],
            0.8
          )
        : createMissingField(
            'Company address',
            ['contact']
          ),
      social_links: createMissingArrayField<{ platform: string; url: string; handle: string }>(
        'Social links for contact slide',
        ['contact', 'footer']
      ),
      footer_text: createInferredField(
        `© ${new Date().getFullYear()} ${brand_kit.brand_name || 'Brand'}`,
        'Footer text',
        ['footer'],
        0.9,
        'Standard copyright footer'
      ),
    };
  }

  private static buildGapsSummary(brandKit: ComprehensiveBrandKit) {
    const gaps: GapInfo[] = [];
    
    // Analyze each section
    const sections = {
      meta: brandKit.meta,
      visual_identity: brandKit.visual_identity,
      verbal_identity: brandKit.verbal_identity,
      audience_positioning: brandKit.audience_positioning,
      product_offers: brandKit.product_offers,
      proof_trust: brandKit.proof_trust,
      seo_identity: brandKit.seo_identity,
      external_presence: brandKit.external_presence,
      content_assets: brandKit.content_assets,
      competitor_analysis: brandKit.competitor_analysis,
    };

    const bySection: any = {};
    let totalFields = 0;
    let totalFound = 0;

    Object.entries(sections).forEach(([sectionName, sectionData]) => {
      const stats = calculateSectionCompleteness(sectionData);
      bySection[sectionName] = stats;
      totalFields += stats.missing_count + stats.inferred_count + stats.found_count;
      totalFound += stats.found_count + stats.inferred_count * 0.5;

      // Identify critical gaps
      this.identifyGapsInSection(sectionName, sectionData, gaps);
    });

    const totalCompleteness = totalFields > 0 ? Math.round((totalFound / totalFields) * 100) : 0;

    return {
      critical_gaps: gaps.filter(g => g.severity === 'critical'),
      inferred_weak: gaps.filter(g => g.severity === 'important'),
      total_completeness: totalCompleteness,
      by_section: bySection,
    };
  }

  private static identifyGapsInSection(sectionName: string, sectionData: any, gaps: GapInfo[]) {
    // Critical missing fields
    const criticalFields: { [key: string]: string[] } = {
      verbal_identity: ['tagline', 'elevator_pitch'],
      audience_positioning: ['primary_icp', 'positioning_statement'],
      proof_trust: ['testimonials', 'case_studies'],
    };

    function traverse(obj: any, path: string[] = []) {
      if (obj && typeof obj === 'object') {
        if ('status' in obj && 'confidence' in obj) {
          const fieldPath = path.join('.');
          const fieldName = path[path.length - 1];
          
          if (obj.status === 'missing' && criticalFields[sectionName]?.includes(fieldName)) {
            gaps.push({
              field: fieldPath,
              section: sectionName,
              severity: 'critical',
              recommendation: obj.description + ' is missing. ' + (obj.notes || ''),
            });
          } else if (obj.status === 'inferred' && obj.confidence < 0.7) {
            gaps.push({
              field: fieldPath,
              section: sectionName,
              severity: 'important',
              recommendation: `${obj.description} has low confidence (${obj.confidence}). ${obj.notes || ''}`,
            });
          }
        } else {
          Object.entries(obj).forEach(([key, value]) => {
            traverse(value, [...path, key]);
          });
        }
      }
    }

    traverse(sectionData, [sectionName]);
  }
}

