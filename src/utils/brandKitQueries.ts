/**
 * MongoDB Query Helpers for Brand Intelligence
 *
 * Handles the complex nested FieldValueEnhanced structure with smart querying
 */

import { BrandProfile } from '../models';
import { FilterQuery } from 'mongoose';

export class BrandKitQueries {
  /**
   * Extract value from FieldValueEnhanced wrapper
   */
  static getValue(field: any): any {
    if (!field) return null;
    if (typeof field === 'object' && 'value' in field) {
      return field.value;
    }
    return field;
  }

  /**
   * Check if field is found (not missing/inferred)
   */
  static isFound(field: any): boolean {
    return field?.status === 'found';
  }

  /**
   * Check if field has high confidence
   */
  static isHighConfidence(field: any, threshold: number = 0.8): boolean {
    return (field?.confidence || 0) >= threshold;
  }

  /**
   * Find profiles with specific logo status
   */
  static async findByLogoStatus(status: 'found' | 'missing' | 'inferred') {
    return BrandProfile.find({
      'brandKit.external_presence.visual_identity_v3.logos.primary_logo_url.status': status
    });
  }

  /**
   * Find profiles with high-confidence data in specific section
   */
  static async findHighConfidenceInSection(section: string, minConfidence: number = 0.8) {
    const query: any = {};
    query[`brandKit.${section}.*.confidence`] = { $gte: minConfidence };
    return BrandProfile.find(query);
  }

  /**
   * Aggregation: Get VoC pain points across all profiles
   */
  static async aggregateVoCPainPoints(userId?: string) {
    const match: any = {};
    if (userId) match.userId = userId;

    return BrandProfile.aggregate([
      { $match: match },
      { $unwind: '$brandKit.proof_trust.reviews.remarks.voc_analysis.pain_points' },
      {
        $group: {
          _id: '$brandKit.proof_trust.reviews.remarks.voc_analysis.pain_points.pain_point',
          totalFrequency: {
            $sum: '$brandKit.proof_trust.reviews.remarks.voc_analysis.pain_points.frequency'
          },
          platforms: {
            $addToSet: '$brandKit.proof_trust.reviews.remarks.voc_analysis.pain_points.platforms'
          },
          exampleQuotes: {
            $push: '$brandKit.proof_trust.reviews.remarks.voc_analysis.pain_points.example_quotes'
          }
        }
      },
      { $sort: { totalFrequency: -1 } },
      { $limit: 10 }
    ]);
  }

  /**
   * Aggregation: Calculate average confidence by section
   */
  static async getDataQualityBySection(profileId: string) {
    return BrandProfile.aggregate([
      { $match: { _id: profileId } },
      {
        $project: {
          sections: {
            $objectToArray: '$brandKit'
          }
        }
      },
      { $unwind: '$sections' },
      {
        $project: {
          section: '$sections.k',
          fields: { $objectToArray: '$sections.v' }
        }
      },
      { $unwind: '$fields' },
      {
        $group: {
          _id: '$section',
          avgConfidence: { $avg: '$fields.v.confidence' },
          foundCount: {
            $sum: {
              $cond: [{ $eq: ['$fields.v.status', 'found'] }, 1, 0]
            }
          },
          inferredCount: {
            $sum: {
              $cond: [{ $eq: ['$fields.v.status', 'inferred'] }, 1, 0]
            }
          },
          missingCount: {
            $sum: {
              $cond: [{ $eq: ['$fields.v.status', 'missing'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { avgConfidence: -1 } }
    ]);
  }

  /**
   * Find profiles with platform discrepancies
   */
  static async findPlatformDiscrepancies(minGap: number = 0.5) {
    return BrandProfile.find({
      'brandKit.proof_trust.reviews.remarks.platform_discrepancy.gap': { $gte: minGap }
    })
    .select('brand_name canonical_domain brandKit.proof_trust.reviews.remarks.platform_discrepancy')
    .lean();
  }

  /**
   * Find profiles missing critical fields
   */
  static async findMissingCriticalFields(fields: string[]) {
    const orConditions = fields.map(field => ({
      [`brandKit.${field}.status`]: 'missing'
    }));

    return BrandProfile.find({
      $or: orConditions
    })
    .select('brand_name canonical_domain')
    .lean();
  }

  /**
   * Get all social platforms for a profile
   */
  static async getSocialPlatforms(profileId: string) {
    const profile = await BrandProfile.findOne({ profileId: profileId.toString() })
      .select('brandKit.external_presence.social_profiles')
      .lean();

    if (!profile?.brandKit?.external_presence?.social_profiles) {
      return [];
    }

    const items = this.getValue(profile.brandKit.external_presence.social_profiles.items) || [];
    return items;
  }

  /**
   * Search profiles by persona and entity type
   */
  static async findByPersonaAndEntity(personaId: string, entityType: string) {
    return BrandProfile.find({
      persona_id: personaId,
      entity_type: entityType,
      status: 'complete'
    })
    .select('brand_name canonical_domain overall_score')
    .sort({ overall_score: -1 });
  }

  /**
   * Get color palette from visual identity
   */
  static async getColorPalette(profileId: string) {
    const profile = await BrandProfile.findOne({ profileId: profileId.toString() })
      .select('brandKit.external_presence.visual_identity_v3.colors')
      .lean();

    if (!profile?.brandKit?.external_presence?.visual_identity_v3?.colors) {
      return null;
    }

    const colors = profile.brandKit.external_presence.visual_identity_v3.colors;

    return {
      primary: this.getValue(colors.primary_colors?.items) || [],
      secondary: this.getValue(colors.secondary_colors?.items) || [],
      accent: this.getValue(colors.accent_colors?.items) || [],
      neutrals: this.getValue(colors.neutrals?.items) || []
    };
  }

  /**
   * Full-text search across brand kit data
   */
  static async searchBrandKitContent(searchTerm: string, userId?: string) {
    const query: FilterQuery<any> = {
      status: 'complete',
      $text: { $search: searchTerm }
    };

    if (userId) {
      query.userId = userId;
    }

    return BrandProfile.find(query)
      .select('brand_name canonical_domain')
      .sort({ score: { $meta: 'textScore' } })
      .limit(20);
  }

  /**
   * Get roadmap quick wins with high impact
   */
  static async getHighImpactQuickWins(profileId: string) {
    const profile = await BrandProfile.findOne({ profileId: profileId.toString() })
      .select('brandRoadmap.quick_wins')
      .lean();

    const quickWins = profile?.brandRoadmap?.quick_wins?.items || [];

    return quickWins.filter((task: any) =>
      task.impact === 'high' && task.effort === 'low'
    );
  }

  /**
   * Aggregation: Score distribution across personas
   */
  static async getScoreDistributionByPersona() {
    return BrandProfile.aggregate([
      { $match: { status: 'complete', overall_score: { $ne: null } } },
      {
        $group: {
          _id: '$persona_id',
          avgScore: { $avg: '$overall_score' },
          minScore: { $min: '$overall_score' },
          maxScore: { $max: '$overall_score' },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgScore: -1 } }
    ]);
  }

  /**
   * Find profiles with specific field status and confidence
   */
  static async findByFieldQuality(
    fieldPath: string,
    status: string,
    minConfidence?: number
  ) {
    const query: any = {
      [`brandKit.${fieldPath}.status`]: status
    };

    if (minConfidence !== undefined) {
      query[`brandKit.${fieldPath}.confidence`] = { $gte: minConfidence };
    }

    return BrandProfile.find(query)
      .select(`brand_name canonical_domain brandKit.${fieldPath}`)
      .lean();
  }

  /**
   * Get testimonials with high ratings
   */
  static async getHighRatedTestimonials(profileId: string, minRating: number = 4.5) {
    const profile = await BrandProfile.findOne({ profileId: profileId.toString() })
      .select('brandKit.proof_trust.testimonials')
      .lean();

    const testimonials = this.getValue(profile?.brandKit?.proof_trust?.testimonials?.items) || [];

    return testimonials.filter((t: any) => (t.rating || 0) >= minRating);
  }

  /**
   * Check data completeness score
   */
  static async calculateCompleteness(profileId: string) {
    const profile = await BrandProfile.findOne({ profileId: profileId.toString() })
      .select('brandKit')
      .lean();

    if (!profile?.brandKit) {
      return { score: 0, found: 0, inferred: 0, missing: 0 };
    }

    let found = 0, inferred = 0, missing = 0, total = 0;

    const traverse = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      if ('status' in obj) {
        total++;
        if (obj.status === 'found') found++;
        else if (obj.status === 'inferred') inferred++;
        else if (obj.status === 'missing') missing++;
      }

      Object.values(obj).forEach(val => {
        if (typeof val === 'object') traverse(val);
      });
    };

    traverse(profile.brandKit);

    return {
      score: total > 0 ? Math.round((found / total) * 100) : 0,
      found,
      inferred,
      missing,
      total
    };
  }
}

export default BrandKitQueries;
