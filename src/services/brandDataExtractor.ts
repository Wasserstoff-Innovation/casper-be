/**
 * Brand Data Extractor Service
 * 
 * Extracts and formats brand kit data for image generation backend
 * Maps comprehensive brand kit structure to image generator's expected format
 */

import BrandKitsService from './brandKit';
import axios from 'axios';
import { ComprehensiveBrandKit } from '../types/brandKit';
import { BrandRoadmap, BrandScores, AnalysisContext } from '../types/wisdomTree';

/**
 * Image Generator Brand Guidelines Format
 * Matches the structure expected by the image generation backend
 */
export interface ImageGeneratorBrandGuidelines {
  brand_basics: {
    brand_name: string;
    tagline?: string;
    mission?: string;
    values?: string;
    target_audience: string;
  };
  visual_identity: {
    primary_color_hex: string;
    secondary_colors: string[];
    primary_font?: string;
    secondary_font?: string;
    logo_url?: string;
    logo_clear_space?: string;
  };
  tone_voice: {
    brand_personality: string;
    writing_style: string;
    key_messages: string[];
    preferred_words: string[];
    avoid_words: string[];
  };
  core_pain_points_addressed: {
    primary_pain_point: string;
    secondary_pain_points: string[];
  };
  messaging_framework?: {
    primary_message: string;
    supporting_messages: string[];
  };
  content_strategy?: {
    content_goal: string;
    content_focus: string;
    content_types: string[];
  };
  imagery?: {
    photography_style?: string;
    mood_tone?: string;
    composition?: string;
    illustration_style?: string;
  };
  competitive_advantages?: string[];
}

/**
 * Brand Assets for Image Generation
 * URLs and file paths for logos, mascots, product images
 */
export interface BrandAssets {
  logo_url?: string;
  logo_file_path?: string; // If downloaded locally
  mascot_url?: string;
  mascot_file_path?: string;
  product_images?: Array<{ url: string; description?: string }>;
  client_logos?: Array<{ name: string; url?: string }>;
}

/**
 * Brand Profile Summary for Database Columns
 */
export interface BrandProfileSummary {
  canonical_domain: string | null;
  brand_name: string | null;
  persona_id: string | null;
  entity_type: string | null;
  business_model: string | null;
  channel_orientation: string | null;
  overall_score: number | null;
  completeness_score: number | null;
  total_critical_gaps: number | null;
  has_social_profiles: number;  // 0 or 1
  has_blog: number;             // 0 or 1
  has_review_sites: number;     // 0 or 1
}

export class BrandDataExtractor {
  // ============================================================================
  // Summary Column Extraction (NEW)
  // ============================================================================

  /**
   * Extract summary columns from Wisdom Tree result for database storage
   */
  static extractSummaryColumns(result: any): BrandProfileSummary {
    const comprehensive: ComprehensiveBrandKit | null = result.comprehensive || result.brand_kit;
    const scores: BrandScores | null = result.brand_scores;
    const context: AnalysisContext | null = result.analysis_context;
    const v2Raw = result.v2_raw || result;

    // Extract domain and brand name
    const canonicalDomain =
      comprehensive?.meta?.canonical_domain?.value ||
      v2Raw?.brand_kit?.domain ||
      context?.canonical_url ||
      null;

    const brandName =
      comprehensive?.meta?.brand_name?.value ||
      v2Raw?.brand_kit?.brand_name ||
      null;

    // Extract persona and entity info
    const personaId = context?.persona_id || null;
    const entityType = context?.entity_type || context?.entity_profile?.entity_type || null;
    const businessModel = context?.business_model || context?.entity_profile?.business_model || null;
    const channelOrientation = context?.channel_orientation || context?.entity_profile?.channel_orientation || null;

    // Extract scores
    const overallScore =
      scores?.overall_score ??
      scores?.dimensions?.overall?.value ??
      null;

    // Extract completeness
    const gaps = comprehensive?.gaps_summary;
    const completenessScore = gaps?.total_completeness ?? 0;
    const totalCriticalGaps = (gaps?.critical_gaps ?? []).length;

    // Extract channel presence flags
    const hasSocialProfiles = this.checkSocialProfilesPresence(comprehensive);
    const hasBlog = this.checkBlogPresence(comprehensive);
    const hasReviewSites = this.checkReviewSitesPresence(comprehensive);

    return {
      canonical_domain: canonicalDomain,
      brand_name: brandName,
      persona_id: personaId,
      entity_type: entityType,
      business_model: businessModel,
      channel_orientation: channelOrientation,
      overall_score: overallScore,
      completeness_score: completenessScore,
      total_critical_gaps: totalCriticalGaps,
      has_social_profiles: hasSocialProfiles ? 1 : 0,
      has_blog: hasBlog ? 1 : 0,
      has_review_sites: hasReviewSites ? 1 : 0,
    };
  }

  private static checkSocialProfilesPresence(comprehensive: any): boolean {
    if (!comprehensive?.external_presence?.social_profiles) return false;
    const socialProfiles = comprehensive.external_presence.social_profiles;
    if (socialProfiles.status === 'found') return true;
    if (socialProfiles.items && socialProfiles.items.length > 0) return true;
    if (socialProfiles.value?.items && socialProfiles.value.items.length > 0) return true;
    return false;
  }

  private static checkBlogPresence(comprehensive: any): boolean {
    if (!comprehensive?.content_assets?.blog_present) return false;
    const blogPresent = comprehensive.content_assets.blog_present;
    if (blogPresent.value?.exists === true) return true;
    if (blogPresent.status === 'found') return true;
    return false;
  }

  private static checkReviewSitesPresence(comprehensive: any): boolean {
    if (!comprehensive?.proof_trust?.third_party_reviews) return false;
    const reviews = comprehensive.proof_trust.third_party_reviews;
    if (reviews.status === 'found') return true;
    if (reviews.items && reviews.items.length > 0) return true;
    if (reviews.value && Array.isArray(reviews.value) && reviews.value.length > 0) return true;
    return false;
  }

  // ============================================================================
  // Social Profiles Extraction (NEW)
  // ============================================================================

  static extractSocialProfiles(comprehensive: any): Array<{
    platform: string;
    profileType: string | null;
    url: string;
    status: string;
    source: string[];
  }> {
    if (!comprehensive?.external_presence?.social_profiles) return [];
    const socialProfiles = comprehensive.external_presence.social_profiles;
    const items = socialProfiles.items || socialProfiles.value?.items || [];
    return items.map((profile: any) => ({
      platform: profile.platform || 'unknown',
      profileType: profile.type || null,
      url: profile.url || '',
      status: socialProfiles.status || 'found',
      source: socialProfiles.source || [],
    }));
  }

  // ============================================================================
  // Roadmap Normalization (NEW)
  // ============================================================================

  static extractRoadmapData(roadmap: BrandRoadmap | null, profileId: string | number) {
    if (!roadmap) {
      return { campaigns: [], milestones: [], tasks: [] };
    }

    const campaigns: any[] = [];
    const milestones: any[] = [];
    const tasks: any[] = [];
    const quickWinsIds = new Set((roadmap.quick_wins || []).map(t => t.id));

    // Campaign 1: Quick Wins
    if (roadmap.quick_wins && roadmap.quick_wins.length > 0) {
      const campaignId = `campaign_quick_wins_${profileId}`;
      campaigns.push({
        id: campaignId,
        brandProfileId: profileId,
        persona: roadmap.analysis_persona?.id || null,
        title: 'Quick Wins',
        shortTitle: 'Quick Wins',
        description: 'High-impact, low-effort tasks you can complete quickly',
        category: 'quick_wins',
        recommendedOrder: 1,
        estimatedTimeline: '1-2 weeks',
        dimensionsAffected: [],
        priorityScore: 100,
      });
      roadmap.quick_wins.forEach((task) => {
        tasks.push(this.normalizeRoadmapTask(task, profileId, campaignId, null, true));
      });
    }

    // Campaign 2: Projects
    if (roadmap.projects && roadmap.projects.length > 0) {
      const campaignId = `campaign_projects_${profileId}`;
      campaigns.push({
        id: campaignId,
        brandProfileId: profileId,
        persona: roadmap.analysis_persona?.id || null,
        title: 'Core Projects',
        shortTitle: 'Projects',
        description: 'Medium-term initiatives to strengthen your brand foundation',
        category: 'projects',
        recommendedOrder: 2,
        estimatedTimeline: '1-2 months',
        dimensionsAffected: [],
        priorityScore: 80,
      });
      roadmap.projects.forEach((task) => {
        if (!quickWinsIds.has(task.id)) {
          tasks.push(this.normalizeRoadmapTask(task, profileId, campaignId, null, false));
        }
      });
    }

    // Campaign 3: Long-term
    if (roadmap.long_term && roadmap.long_term.length > 0) {
      const campaignId = `campaign_long_term_${profileId}`;
      campaigns.push({
        id: campaignId,
        brandProfileId: profileId,
        persona: roadmap.analysis_persona?.id || null,
        title: 'Long-term Initiatives',
        shortTitle: 'Long-term',
        description: 'Strategic initiatives for sustained growth',
        category: 'long_term',
        recommendedOrder: 3,
        estimatedTimeline: '3-6 months',
        dimensionsAffected: [],
        priorityScore: 60,
      });
      roadmap.long_term.forEach((task) => {
        if (!quickWinsIds.has(task.id)) {
          tasks.push(this.normalizeRoadmapTask(task, profileId, campaignId, null, false));
        }
      });
    }

    return { campaigns, milestones, tasks };
  }

  private static normalizeRoadmapTask(
    task: any,
    profileId: string | number,
    campaignId: string | null,
    milestoneId: string | null,
    isQuickWin: boolean
  ) {
    return {
      id: task.id,
      brandProfileId: profileId,
      campaignId: campaignId,
      milestoneId: milestoneId,
      title: task.description || task.title || 'Untitled Task',
      description: task.description || '',
      category: task.category || 'other',
      impact: task.impact || 'medium',
      effort: task.effort || 'medium',
      targets: [],
      suggestedOwner: null,
      suggestedTools: [],
      priorityScore: this.calculatePriorityScore(task.priority, task.impact, task.effort),
      status: 'pending',
      dependsOn: [],
      acceptanceCriteria: null,
      isQuickWin: isQuickWin ? 1 : 0,
    };
  }

  private static calculatePriorityScore(priority: string, impact: string, effort: string): number {
    const priorityMap: Record<string, number> = { critical: 100, high: 80, medium: 60, low: 40 };
    const impactMap: Record<string, number> = { high: 30, medium: 20, low: 10 };
    const effortMap: Record<string, number> = { low: 10, medium: 5, high: 0 };
    return (priorityMap[priority] || 50) + (impactMap[impact] || 20) + (effortMap[effort] || 5);
  }

  // ============================================================================
  // Image Generation Methods (EXISTING)
  // ============================================================================

  /**
   * Extract brand guidelines from brand kit for image generation
   * @param profileId Brand profile ID
   * @returns Formatted brand guidelines matching image generator format
   */
  static async extractBrandGuidelines(profileId: string): Promise<ImageGeneratorBrandGuidelines> {
    const brandKitData = await BrandKitsService.getBrandKitByProfileId(profileId);
    
    if (!brandKitData || !brandKitData.comprehensive) {
      throw new Error(`Brand kit not found or incomplete for profile: ${profileId}`);
    }

    const kit = brandKitData.comprehensive as ComprehensiveBrandKit;
    
    return this.formatBrandGuidelines(kit);
  }

  /**
   * Format comprehensive brand kit to image generator format
   */
  static formatBrandGuidelines(kit: ComprehensiveBrandKit): ImageGeneratorBrandGuidelines {
    // Extract values from BrandKitField wrappers
    const getValue = <T>(field: any): T | null => {
      if (!field || field.status === 'missing') return null;
      return field.value as T;
    };

    const getArray = <T>(field: any): T[] => {
      if (!field || field.status === 'missing' || !field.items) return [];
      return field.items as T[];
    };

    // Brand Basics
    const brandName = getValue<string>(kit.meta.brand_name) || 'Unknown Brand';
    const tagline = getValue<string>(kit.verbal_identity.tagline);
    const mission = getValue<string>(kit.audience_positioning.positioning_statement);
    const values = getArray<string>(kit.verbal_identity.core_value_props).join(', ');
    
    // Target Audience - combine ICP info
    const primaryICP = getValue<any>(kit.audience_positioning.primary_icp);
    const targetAudience = primaryICP 
      ? `${primaryICP.role} at ${primaryICP.company_type} companies (${primaryICP.company_size})`
      : getValue<string>(kit.meta.industry) || 'General audience';

    // Visual Identity - Colors
    const primaryColors = getArray<any>(kit.visual_identity.color_system.primary_colors);
    const primaryColorHex = primaryColors.length > 0 ? primaryColors[0].hex : '#000000';
    const secondaryColors = getArray<any>(kit.visual_identity.color_system.secondary_colors)
      .map(c => c.hex);

    // Typography
    const headingFont = getValue<any>(kit.visual_identity.typography.heading_font);
    const bodyFont = getValue<any>(kit.visual_identity.typography.body_font);
    const primaryFont = headingFont?.name || bodyFont?.name;
    const secondaryFont = bodyFont?.name || headingFont?.name;

    // Logo
    const logoUrl = getValue<string>(kit.visual_identity.logos.primary_logo_url);

    // Tone & Voice
    const toneAdjectives = getArray<string>(kit.verbal_identity.tone_of_voice.adjectives);
    const toneGuidance = getValue<string>(kit.verbal_identity.tone_of_voice.guidance);
    const brandPersonality = getValue<string>(kit.verbal_identity.brand_personality) || 
      toneAdjectives.join(', ');
    const writingStyle = toneGuidance || 'Professional and clear';
    
    const keyMessages = getArray<string>(kit.verbal_identity.core_value_props);
    const preferredWords = getArray<string>(kit.verbal_identity.key_phrases);
    const avoidWords = getArray<string>(kit.verbal_identity.words_to_avoid);

    // Pain Points
    const problemsSolved = getArray<string>(kit.audience_positioning.problems_solved);
    const primaryPainPoint = problemsSolved.length > 0 ? problemsSolved[0] : '';
    const secondaryPainPoints = problemsSolved.slice(1);

    // Messaging Framework
    const elevatorPitch = getValue<string>(kit.verbal_identity.elevator_pitch);
    const primaryMessage = elevatorPitch || tagline || keyMessages[0] || '';
    const supportingMessages = keyMessages.slice(1);

    // Content Strategy (if available)
    const contentTypes = getArray<string>(kit.content_assets.content_types);
    const contentGoal = 'Engage and convert target audience'; // Default
    const contentFocus = keyMessages.join(', ');

    // Imagery Style
    const imageryStyle = getValue<string>(kit.visual_identity.imagery.style_type);
    const illustrationStyle = getValue<string>(kit.visual_identity.imagery.illustration_style);
    const photographyStyle = imageryStyle === 'photography' ? 'Professional' : undefined;
    const moodTone = toneAdjectives.join(', ');

    // Competitive Advantages
    const benefits = getArray<string>(kit.audience_positioning.benefits_promised);
    const competitiveAdvantages = benefits;

    return {
      brand_basics: {
        brand_name: brandName,
        tagline: tagline || undefined,
        mission: mission || undefined,
        values: values || undefined,
        target_audience: targetAudience,
      },
      visual_identity: {
        primary_color_hex: primaryColorHex,
        secondary_colors: secondaryColors,
        primary_font: primaryFont,
        secondary_font: secondaryFont,
        logo_url: logoUrl || undefined,
        logo_clear_space: '10%', // Default, can be enhanced
      },
      tone_voice: {
        brand_personality: brandPersonality,
        writing_style: writingStyle,
        key_messages: keyMessages.length > 0 ? keyMessages : [primaryMessage],
        preferred_words: preferredWords,
        avoid_words: avoidWords,
      },
      core_pain_points_addressed: {
        primary_pain_point: primaryPainPoint,
        secondary_pain_points: secondaryPainPoints,
      },
      messaging_framework: {
        primary_message: primaryMessage,
        supporting_messages: supportingMessages,
      },
      content_strategy: {
        content_goal: contentGoal,
        content_focus: contentFocus,
        content_types: contentTypes.length > 0 ? contentTypes : ['social_media', 'blog'],
      },
      imagery: {
        photography_style: photographyStyle,
        mood_tone: moodTone || undefined,
        illustration_style: illustrationStyle || undefined,
      },
      competitive_advantages: competitiveAdvantages.length > 0 ? competitiveAdvantages : undefined,
    };
  }

  /**
   * Extract brand assets (logos, mascots, product images) for image generation
   * @param profileId Brand profile ID
   * @returns Brand assets with URLs and optional local file paths
   */
  static async extractBrandAssets(profileId: string): Promise<BrandAssets> {
    const brandKitData = await BrandKitsService.getBrandKitByProfileId(profileId);
    
    if (!brandKitData || !brandKitData.comprehensive) {
      throw new Error(`Brand kit not found for profile: ${profileId}`);
    }

    const kit = brandKitData.comprehensive as ComprehensiveBrandKit;
    
    const getValue = <T>(field: any): T | null => {
      if (!field || field.status === 'missing') return null;
      return field.value as T;
    };

    const getArray = <T>(field: any): T[] => {
      if (!field || field.status === 'missing' || !field.items) return [];
      return field.items as T[];
    };

    // Logo
    const logoUrl = getValue<string>(kit.visual_identity.logos.primary_logo_url);
    const logoVariations = getArray<{ type: string; url: string }>(
      kit.visual_identity.logos.logo_variations
    );

    // Client logos (for social proof in images)
    const clientLogos = getArray<{ name: string; logo_url?: string }>(
      kit.proof_trust.client_logos
    );

    // Product images (from product offers or content assets)
    // Note: This might need to be enhanced based on actual data structure
    const products = getArray<any>(kit.product_offers.products);
    const productImages: Array<{ url: string; description?: string }> = products
      .filter(p => p.image_url)
      .map(p => ({ url: p.image_url, description: p.description }));

    return {
      logo_url: logoUrl || undefined,
      logo_file_path: undefined, // Would be set if we download the logo
      mascot_url: undefined, // Mascot would come from separate mascot generation
      mascot_file_path: undefined,
      product_images: productImages.length > 0 ? productImages : undefined,
      client_logos: clientLogos.length > 0 ? clientLogos : undefined,
    };
  }

  /**
   * Download logo file from URL for use in image generation
   * @param logoUrl Logo URL
   * @returns Local file path or buffer
   */
  static async downloadLogo(logoUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(logoUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });
      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('Failed to download logo:', error.message);
      throw new Error(`Failed to download logo from ${logoUrl}: ${error.message}`);
    }
  }

  /**
   * Get completeness score for brand guidelines
   * Returns percentage of required fields that are available
   */
  static getCompletenessScore(kit: ComprehensiveBrandKit): {
    score: number;
    missing_critical: string[];
    available_fields: string[];
  } {
    const criticalFields = [
      'meta.brand_name',
      'visual_identity.color_system.primary_colors',
      'verbal_identity.tone_of_voice',
      'audience_positioning.primary_icp',
      'audience_positioning.problems_solved',
    ];

    const getValue = (field: any): boolean => {
      return field && field.status !== 'missing' && field.value !== null;
    };

    const getArray = (field: any): boolean => {
      return field && field.status !== 'missing' && field.items && field.items.length > 0;
    };

    const missing: string[] = [];
    const available: string[] = [];

    // Check each critical field
    if (!getValue(kit.meta.brand_name)) missing.push('brand_name');
    else available.push('brand_name');

    if (!getArray(kit.visual_identity.color_system.primary_colors)) missing.push('primary_colors');
    else available.push('primary_colors');

    if (!getValue(kit.verbal_identity.tone_of_voice.guidance) && 
        !getArray(kit.verbal_identity.tone_of_voice.adjectives)) {
      missing.push('tone_of_voice');
    } else {
      available.push('tone_of_voice');
    }

    if (!getValue(kit.audience_positioning.primary_icp)) missing.push('target_audience');
    else available.push('target_audience');

    if (!getArray(kit.audience_positioning.problems_solved)) missing.push('pain_points');
    else available.push('pain_points');

    const score = Math.round((available.length / criticalFields.length) * 100);

    return {
      score,
      missing_critical: missing,
      available_fields: available,
    };
  }
}
