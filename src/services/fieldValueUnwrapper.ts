/**
 * FieldValue Unwrapper Service
 *
 * Transforms comprehensive brand kit data with FieldValue wrappers
 * into a clean, frontend-friendly format that includes both values and metadata
 */

import {
  FieldValue,
  FieldMetadata,
  getValue,
  getItems,
  getMetadata,
  isFieldPresent,
} from '../types/fieldValue';

export interface UnwrappedField<T> {
  value: T;
  meta?: FieldMetadata;
}

export interface UnwrappedBrandKit {
  // Meta information
  meta: {
    brandName: UnwrappedField<string | null>;
    domain: UnwrappedField<string | null>;
    industry: UnwrappedField<string | null>;
    companyType: UnwrappedField<string | null>;
    generatedAt: UnwrappedField<string | null>;
  };

  // Verbal Identity
  verbalIdentity: {
    tagline: UnwrappedField<string | null>;
    elevatorPitch: UnwrappedField<string | null>;
    valueProposition: UnwrappedField<string | null>;
    brandStory: UnwrappedField<string | null>;
    toneVoice: UnwrappedField<string[]>;
    personalityTraits: UnwrappedField<string[]>;
    messaging: UnwrappedField<any>;
    positioning: UnwrappedField<any>;
  };

  // Audience Positioning
  audiencePositioning: {
    primaryICP: UnwrappedField<any>;
    problemsSolved: UnwrappedField<string[]>;
    benefitsPromised: UnwrappedField<string[]>;
    positioningStatement: UnwrappedField<string | null>;
  };

  // External Presence
  externalPresence: {
    socialProfiles: UnwrappedField<any[]>;
    directoriesMarketplaces: UnwrappedField<any[]>;
    mediaMentions: UnwrappedField<any[]>;
    communityPlatforms: UnwrappedField<string[]>;
    visualIdentity: UnwrappedField<any>;
  };

  // Proof & Trust
  proofTrust: {
    testimonials: UnwrappedField<any>;
    caseStudies: UnwrappedField<any>;
    clientLogos: UnwrappedField<any>;
    thirdPartyReviews: UnwrappedField<any>;
    awardsCertifications: UnwrappedField<any>;
    securityCompliance: UnwrappedField<any>;
  };

  // SEO Identity
  seoIdentity: {
    primaryKeywords: UnwrappedField<string[]>;
    secondaryKeywords: UnwrappedField<string[]>;
    topicClusters: UnwrappedField<string[]>;
    serpSnapshot: UnwrappedField<any>;
    metaTagsQuality: UnwrappedField<string | null>;
    technicalSeoScore: UnwrappedField<number | null>;
  };

  // Content Assets
  contentAssets: {
    blogPresent: UnwrappedField<any>;
    contentTypes: UnwrappedField<string[]>;
    postingFrequency: UnwrappedField<string | null>;
    estimatedTotalAssets: UnwrappedField<number | null>;
    contentQualityAssessment: UnwrappedField<string | null>;
    contentThemes: UnwrappedField<any>;
    contentGaps: UnwrappedField<any>;
  };

  // Conversion Analysis
  conversionAnalysis: {
    primaryCTA: UnwrappedField<any>;
    frictionAssessment: UnwrappedField<string | null>;
    pricingDetails: UnwrappedField<any>;
    trustSignalsAboveFold: UnwrappedField<string[]>;
  };

  // Product Offers
  productOffers: {
    products: UnwrappedField<any[]>;
    plans: UnwrappedField<any>;
    keyFeatures: UnwrappedField<any>;
    guarantees: UnwrappedField<any>;
  };

  // Gaps & Completeness
  gaps: {
    criticalGaps: any[];
    bySection: any;
    totalCompleteness: number;
  };
}

export class FieldValueUnwrapper {
  /**
   * Unwrap a single field with metadata
   */
  private static unwrapField<T>(field: any): UnwrappedField<T> {
    const value = getValue<T>(field);
    const meta = getMetadata(field);

    return {
      value: value as T,
      ...(meta && { meta }),
    };
  }

  /**
   * Unwrap an array field with metadata
   */
  private static unwrapArrayField<T>(field: any): UnwrappedField<T[]> {
    const value = getItems<T>(field);
    const meta = getMetadata(field);

    return {
      value,
      ...(meta && { meta }),
    };
  }

  /**
   * Unwrap entire comprehensive brand kit
   */
  static unwrapBrandKit(comprehensive: any): UnwrappedBrandKit {
    if (!comprehensive) {
      throw new Error('No comprehensive brand kit data provided');
    }

    return {
      // Meta
      meta: {
        brandName: this.unwrapField(comprehensive.meta?.brand_name || comprehensive.brand_name),
        domain: this.unwrapField(comprehensive.meta?.canonical_domain || comprehensive.domain),
        industry: this.unwrapField(comprehensive.meta?.industry),
        companyType: this.unwrapField(comprehensive.meta?.company_type),
        generatedAt: this.unwrapField(comprehensive.meta?.audit_timestamp || comprehensive.generated_at),
      },

      // Verbal Identity
      verbalIdentity: {
        tagline: this.unwrapField(comprehensive.verbal_identity?.tagline),
        elevatorPitch: this.unwrapField(comprehensive.verbal_identity?.elevator_pitch),
        valueProposition: this.unwrapField(comprehensive.verbal_identity?.value_proposition),
        brandStory: this.unwrapField(comprehensive.verbal_identity?.brand_story),
        toneVoice: this.unwrapArrayField(comprehensive.verbal_identity?.tone_voice),
        personalityTraits: this.unwrapArrayField(comprehensive.verbal_identity?.personality_traits),
        messaging: this.unwrapField(comprehensive.verbal_identity?.messaging),
        positioning: this.unwrapField(comprehensive.verbal_identity?.positioning),
      },

      // Audience Positioning
      audiencePositioning: {
        primaryICP: this.unwrapField(comprehensive.audience_positioning?.primary_icp),
        problemsSolved: this.unwrapArrayField(comprehensive.audience_positioning?.problems_solved),
        benefitsPromised: this.unwrapArrayField(comprehensive.audience_positioning?.benefits_promised),
        positioningStatement: this.unwrapField(comprehensive.audience_positioning?.positioning_statement),
      },

      // External Presence
      externalPresence: {
        socialProfiles: this.unwrapArrayField(comprehensive.external_presence?.social_profiles),
        directoriesMarketplaces: this.unwrapArrayField(comprehensive.external_presence?.directories_marketplaces),
        mediaMentions: this.unwrapArrayField(comprehensive.external_presence?.media_mentions),
        communityPlatforms: this.unwrapArrayField(comprehensive.external_presence?.community_platforms),
        visualIdentity: this.unwrapField(comprehensive.external_presence?.visual_identity_v3),
      },

      // Proof & Trust
      proofTrust: {
        testimonials: this.unwrapField(comprehensive.proof_trust?.testimonials),
        caseStudies: this.unwrapField(comprehensive.proof_trust?.case_studies),
        clientLogos: this.unwrapField(comprehensive.proof_trust?.client_logos),
        thirdPartyReviews: this.unwrapField(comprehensive.proof_trust?.third_party_reviews),
        awardsCertifications: this.unwrapField(comprehensive.proof_trust?.awards_certifications),
        securityCompliance: this.unwrapField(comprehensive.proof_trust?.security_compliance),
      },

      // SEO Identity
      seoIdentity: {
        primaryKeywords: this.unwrapArrayField(comprehensive.seo_identity?.primary_keywords),
        secondaryKeywords: this.unwrapArrayField(comprehensive.seo_identity?.secondary_keywords),
        topicClusters: this.unwrapArrayField(comprehensive.seo_identity?.topic_clusters),
        serpSnapshot: this.unwrapField(comprehensive.seo_identity?.serp_snapshot),
        metaTagsQuality: this.unwrapField(comprehensive.seo_identity?.meta_tags_quality),
        technicalSeoScore: this.unwrapField(comprehensive.seo_identity?.technical_seo_score),
      },

      // Content Assets
      contentAssets: {
        blogPresent: this.unwrapField(comprehensive.content_assets?.blog_present),
        contentTypes: this.unwrapArrayField(comprehensive.content_assets?.content_types),
        postingFrequency: this.unwrapField(comprehensive.content_assets?.posting_frequency),
        estimatedTotalAssets: this.unwrapField(comprehensive.content_assets?.estimated_total_assets),
        contentQualityAssessment: this.unwrapField(comprehensive.content_assets?.content_quality_assessment),
        contentThemes: this.unwrapField(comprehensive.content_assets?.content_themes),
        contentGaps: this.unwrapField(comprehensive.content_assets?.content_gaps),
      },

      // Conversion Analysis
      conversionAnalysis: {
        primaryCTA: this.unwrapField(comprehensive.conversion_analysis_v2?.primary_cta),
        frictionAssessment: this.unwrapField(comprehensive.conversion_analysis_v2?.friction_assessment),
        pricingDetails: this.unwrapField(comprehensive.conversion_analysis_v2?.pricing_details),
        trustSignalsAboveFold: this.unwrapArrayField(comprehensive.conversion_analysis_v2?.trust_signals_above_fold),
      },

      // Product Offers
      productOffers: {
        products: this.unwrapArrayField(comprehensive.product_offers?.products),
        plans: this.unwrapField(comprehensive.product_offers?.plans),
        keyFeatures: this.unwrapField(comprehensive.product_offers?.key_features),
        guarantees: this.unwrapField(comprehensive.product_offers?.guarantees),
      },

      // Gaps & Completeness
      gaps: {
        criticalGaps: comprehensive.gaps_summary?.critical_gaps || [],
        bySection: comprehensive.gaps_summary?.by_section || {},
        totalCompleteness: comprehensive.gaps_summary?.total_completeness || 0,
      },
    };
  }

  /**
   * Extract field metadata summary for data quality dashboard
   */
  static extractDataQualitySummary(comprehensive: any): {
    totalFields: number;
    foundFields: number;
    inferredFields: number;
    missingFields: number;
    averageConfidence: number;
    sourceBreakdown: Record<string, number>;
    lowConfidenceFields: Array<{ field: string; confidence: number }>;
  } {
    const allFields: any[] = [];
    const lowConfidenceThreshold = 0.5;

    // Recursively collect all FieldValue objects
    const collectFields = (obj: any, path: string = '') => {
      if (!obj || typeof obj !== 'object') return;

      // Check if this is a FieldValue
      if ('value' in obj && 'status' in obj && 'confidence' in obj) {
        allFields.push({ ...obj, path });
        return;
      }

      // Recurse into nested objects
      for (const key in obj) {
        const newPath = path ? `${path}.${key}` : key;
        collectFields(obj[key], newPath);
      }
    };

    collectFields(comprehensive);

    // Calculate statistics
    const foundFields = allFields.filter(f => f.status === 'found').length;
    const inferredFields = allFields.filter(f => f.status === 'inferred').length;
    const missingFields = allFields.filter(f => f.status === 'missing').length;

    const totalConfidence = allFields.reduce((sum, f) => sum + (f.confidence || 0), 0);
    const averageConfidence = allFields.length > 0 ? totalConfidence / allFields.length : 0;

    // Source breakdown
    const sourceBreakdown: Record<string, number> = {};
    allFields.forEach(field => {
      (field.source || []).forEach((src: string) => {
        sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
      });
    });

    // Low confidence fields
    const lowConfidenceFields = allFields
      .filter(f => f.confidence < lowConfidenceThreshold && f.status !== 'missing')
      .map(f => ({ field: f.path, confidence: f.confidence }))
      .sort((a, b) => a.confidence - b.confidence)
      .slice(0, 10); // Top 10 lowest

    return {
      totalFields: allFields.length,
      foundFields,
      inferredFields,
      missingFields,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      sourceBreakdown,
      lowConfidenceFields,
    };
  }
}
