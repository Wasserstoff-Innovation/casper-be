/**
 * Brand Intelligence Service
 *
 * Builds view models for frontend consumption from database data
 */

import db from '../config/db';
import { brandProfiles, brandRoadmapCampaigns, brandRoadmapTasks } from '../model/schema';
import { eq, and, count } from 'drizzle-orm';
import {
  BrandIntelligenceView,
  BrandIntelligenceDetailView,
  BrandProfileListItem,
  BrandScoresView,
  ChannelsOverviewView,
  BrandKitSummaryView,
  RoadmapSummaryView,
  StrengthRisk,
  UICriticalGap,
  ChannelStatus,
  RoadmapTaskSummary,
  RoadmapCampaignSummary,
  DIMENSION_LABELS,
  SECTION_LABELS,
} from '../types/brandIntelligence';
import { FieldValueUnwrapper } from './fieldValueUnwrapper';
import { getValue as getFieldValue, getItems as getFieldItems } from '../types/fieldValue';

export class BrandIntelligenceService {
  /**
   * Get summary view for brand intelligence (lightweight for drawer/list)
   */
  static async getSummaryView(profileId: number): Promise<BrandIntelligenceView> {
    // Fetch brand profile
    const profiles = await db.select()
      .from(brandProfiles)
      .where(eq(brandProfiles.id, profileId))
      .limit(1);

    if (profiles.length === 0) {
      throw new Error(`Brand profile not found: ${profileId}`);
    }

    const profile = profiles[0];

    if (profile.status !== 'complete') {
      throw new Error(`Brand profile is not complete. Status: ${profile.status}`);
    }

    const comprehensive = profile.brandKit;
    const scores = profile.brandScores;
    const roadmap = profile.brandRoadmap;
    const context = profile.analysis_context;

    // Build view model
    return {
      id: profile.id,
      domain: profile.canonical_domain || 'unknown',
      brandName: profile.brand_name,

      analysisContext: {
        personaId: profile.persona_id,
        personaLabel: context?.persona_label || null,
        entityType: profile.entity_type,
        businessModel: profile.business_model,
        channelOrientation: profile.channel_orientation,
        completenessScore: profile.completeness_score || 0,
        generatedAt: comprehensive?.meta?.audit_timestamp?.value || profile.created_at?.toISOString() || '',
      },

      snapshot: this.buildSnapshot(comprehensive, scores, profile),
      scores: this.buildScoresView(scores),
      channels: this.buildChannelsView(comprehensive),
      brandKitSummary: this.buildBrandKitSummary(comprehensive),
      criticalGaps: this.buildCriticalGaps(comprehensive),
      roadmapSummary: await this.buildRoadmapSummary(profileId, roadmap),
    };
  }

  /**
   * Get detail view (full data for deep dive)
   */
  static async getDetailView(profileId: number): Promise<BrandIntelligenceDetailView> {
    const summaryView = await this.getSummaryView(profileId);

    const profiles = await db.select()
      .from(brandProfiles)
      .where(eq(brandProfiles.id, profileId))
      .limit(1);

    const profile = profiles[0];
    const comprehensive = profile.brandKit;

    // Unwrap FieldValues and extract clean data with metadata
    let brandKitUnwrapped: any = null;
    let dataQuality: any = {
      totalFields: 0,
      foundFields: 0,
      inferredFields: 0,
      missingFields: 0,
      averageConfidence: 0,
      sourceBreakdown: {},
      lowConfidenceFields: [],
    };

    try {
      if (comprehensive) {
        brandKitUnwrapped = FieldValueUnwrapper.unwrapBrandKit(comprehensive);
        dataQuality = FieldValueUnwrapper.extractDataQualitySummary(comprehensive);
      }
    } catch (error: any) {
      console.warn('⚠️ Could not unwrap brand kit:', error.message);
      // Fallback: return comprehensive data as-is
      brandKitUnwrapped = comprehensive;
    }

    return {
      ...summaryView,
      brandKitUnwrapped,
      dataQuality,
      brandKitRaw: comprehensive,
      roadmapFull: profile.brandRoadmap,
      analysisContextFull: profile.analysis_context,
    };
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  private static buildSnapshot(comprehensive: any, scores: any, profile: any) {
    const gaps = comprehensive?.gaps_summary || {};
    const evidence = comprehensive?.evidence_sources || comprehensive?.meta?.data_sources?.value || {};

    // Build strengths and risks from scores
    // Handle BOTH flat format (current) and nested format (future)
    const dimensions = scores?.dimensions || {};
    const dimensionScores: { id: string; label: string; value: number; status: string }[] = [];

    // If scores is flat format (current Python backend)
    if (!dimensions || Object.keys(dimensions).length === 0) {
      // Build from flat scores
      Object.keys(scores || {}).forEach(key => {
        if (key !== 'overall_score' && key !== 'score_rationale' && typeof scores[key] === 'number') {
          dimensionScores.push({
            id: key,
            label: DIMENSION_LABELS[key] || key,
            value: scores[key],
            status: 'scored',
          });
        }
      });
    } else {
      // Use nested dimensions (future Python backend)
      Object.keys(dimensions).forEach(key => {
        const dim = dimensions[key];
        if (dim.status === 'scored' && dim.value !== null) {
          dimensionScores.push({
            id: key,
            label: DIMENSION_LABELS[key] || key,
            value: dim.value,
            status: dim.status,
          });
        }
      });
    }

    // Sort by value
    dimensionScores.sort((a, b) => (b.value || 0) - (a.value || 0));

    const strengths = dimensionScores.slice(0, 3); // Top 3
    const risks = dimensionScores.slice(-3).reverse(); // Bottom 3

    // Count fields by status
    const bySection = gaps.by_section || {};
    let totalFound = 0;
    let totalInferred = 0;
    let totalMissing = 0;

    Object.values(bySection).forEach((section: any) => {
      totalFound += section.found_count || 0;
      totalInferred += section.inferred_count || 0;
      totalMissing += section.missing_count || 0;
    });

    // Section completeness map
    const sectionCompleteness: Record<string, number> = {};
    Object.keys(bySection).forEach(sectionId => {
      const section = bySection[sectionId];
      sectionCompleteness[sectionId] = section.completeness || 0;
    });

    return {
      overallScore: profile.overall_score,
      strengths: strengths as StrengthRisk[],
      risks: risks as StrengthRisk[],
      fieldsFound: totalFound,
      fieldsInferred: totalInferred,
      fieldsMissing: totalMissing,
      totalCriticalGaps: profile.total_critical_gaps || 0,
      sectionCompleteness,
      evidenceSummary: {
        sitePages: typeof evidence.site_pages === 'number' ? evidence.site_pages : (evidence.site_pages?.length || 0),
        screenshots: typeof evidence.screenshots === 'number' ? evidence.screenshots : (evidence.screenshots?.length || 0),
        searchResults: typeof evidence.search_results === 'number' ? evidence.search_results : (evidence.search_results?.length || 0),
      },
    };
  }

  private static buildScoresView(scores: any): BrandScoresView {
    if (!scores) {
      return {
        overall: null,
        dimensions: {},
      };
    }

    const dimensions: any = {};

    // Handle BOTH flat format (current) and nested format (future)
    if (scores.dimensions && Object.keys(scores.dimensions).length > 0) {
      // Nested format (future)
      Object.keys(scores.dimensions).forEach(key => {
        const dim = scores.dimensions[key];
        dimensions[key] = {
          value: dim.value,
          status: dim.status,
          label: DIMENSION_LABELS[key] || key,
        };
      });
    } else {
      // Flat format (current) - convert to nested structure
      Object.keys(scores).forEach(key => {
        if (key !== 'overall_score' && key !== 'score_rationale' && typeof scores[key] === 'number') {
          dimensions[key] = {
            value: scores[key],
            status: 'scored',
            label: DIMENSION_LABELS[key] || key,
          };
        }
      });
    }

    return {
      overall: scores.overall_score ?? null,
      dimensions,
      metadata: scores.metadata,
    };
  }

  private static buildChannelsView(comprehensive: any): ChannelsOverviewView {
    const channels: ChannelStatus[] = [];

    // Use imported helpers from fieldValue.ts (handle FieldValue format properly)
    const getValue = getFieldValue;
    const getItems = getFieldItems;

    // Website (always present if we have data)
    const domain = getValue(comprehensive?.meta?.canonical_domain)
      || comprehensive?.domain
      || 'Domain';
    channels.push({
      id: 'website',
      label: 'Website',
      present: true,
      details: domain,
    });

    // Blog - handle both formats
    const blogPresent = comprehensive?.content_assets?.blog_present;
    let hasBlog = false;

    if (blogPresent) {
      // FUTURE format: {value: {exists: true}, status: 'found'}
      if (blogPresent.value && blogPresent.value.exists === true) {
        hasBlog = true;
      }
      // Check status field
      else if (blogPresent.status === 'found') {
        hasBlog = true;
      }
      // CURRENT format: {exists: true} or just true
      else if (blogPresent.exists === true || blogPresent === true) {
        hasBlog = true;
      }
    }

    channels.push({
      id: 'blog',
      label: 'Blog',
      present: hasBlog,
      details: hasBlog ? 'Active' : undefined,
    });

    // Social Profiles - handle both formats
    const socialProfiles = comprehensive?.external_presence?.social_profiles;
    const socialItems = getItems(socialProfiles);
    const hasSocial = socialItems.length > 0 || socialProfiles?.status === 'found';

    if (hasSocial && socialItems.length > 0) {
      socialItems.forEach((profile: any) => {
        channels.push({
          id: profile.platform?.toLowerCase() || 'social',
          label: profile.platform || 'Social',
          present: true,
          urls: [profile.url],
        });
      });
    } else {
      channels.push({
        id: 'social',
        label: 'Social Media',
        present: false,
      });
    }

    // Review Sites - handle both formats
    const reviews = comprehensive?.proof_trust?.third_party_reviews;
    const reviewItems = getItems(reviews);
    const hasReviews = reviewItems.length > 0 || reviews?.status === 'found';

    channels.push({
      id: 'review_sites',
      label: 'Review Sites',
      present: hasReviews,
      details: hasReviews ? `${reviewItems.length} platforms` : undefined,
    });

    // Build summary text
    const presentChannels = channels.filter(c => c.present).map(c => c.label);
    const missingChannels = channels.filter(c => !c.present).map(c => c.label);

    const summaryText = `Channels used: ${presentChannels.join(', ')}. ${
      missingChannels.length > 0 ? `Missing: ${missingChannels.join(', ')}.` : ''
    }`;

    return {
      channels,
      summaryText,
    };
  }

  private static buildBrandKitSummary(comprehensive: any): BrandKitSummaryView {
    if (!comprehensive) {
      return {
        meta: { brandName: null, domain: null, industry: null, companyType: null },
        visualIdentity: { primaryLogo: null, primaryColors: [], headingFont: null, bodyFont: null },
        verbalIdentity: { tagline: null, elevatorPitch: null, toneAdjectives: [] },
        audiencePositioning: { primaryICP: null, problemsSolved: [], category: null },
        proof: { testimonials: 0, caseStudies: 0, clientLogos: 0, awards: 0 },
      };
    }

    // Use imported helpers from fieldValue.ts (handle FieldValue format properly)
    const getValue = getFieldValue;
    const getItems = getFieldItems;

    // Meta - handle both nested meta section and top-level fields (old v2 format)
    const meta = {
      brandName: getValue(comprehensive.meta?.brand_name) || comprehensive.brand_name || null,
      domain: getValue(comprehensive.meta?.canonical_domain) || comprehensive.domain || null,
      industry: getValue(comprehensive.meta?.industry) || comprehensive.industry || null,
      companyType: getValue(comprehensive.meta?.company_type) || comprehensive.company_type || null,
    };

    // Visual Identity - handle BOTH old v2 format and new comprehensive format
    // NEW format: color_system.primary_colors, logos.primary_logo_url, typography.heading_font
    // OLD format: color_palette, heading_style, body_style (no logos)
    const visualId = comprehensive.visual_identity || {};

    // Colors
    let primaryColors: any[] = [];
    if (visualId.color_system?.primary_colors) {
      // NEW format
      primaryColors = getItems(visualId.color_system.primary_colors);
    } else if (visualId.color_palette) {
      // OLD v2 format - color_palette is array of hex strings
      primaryColors = Array.isArray(visualId.color_palette)
        ? visualId.color_palette.map((hex: string) => ({ hex }))
        : [];
    }

    // Logo
    const primaryLogo = getValue(visualId.logos?.primary_logo_url) || null;

    // Typography
    let headingFont = null;
    let bodyFont = null;

    if (visualId.typography?.heading_font) {
      // NEW format
      const hf = getValue(visualId.typography.heading_font);
      headingFont = typeof hf === 'object' ? hf?.name : hf;
    } else if (visualId.typography?.heading_style) {
      // OLD v2 format
      headingFont = visualId.typography.heading_style;
    }

    if (visualId.typography?.body_font) {
      // NEW format
      const bf = getValue(visualId.typography.body_font);
      bodyFont = typeof bf === 'object' ? bf?.name : bf;
    } else if (visualId.typography?.body_style) {
      // OLD v2 format
      bodyFont = visualId.typography.body_style;
    }

    const visualIdentity = {
      primaryLogo,
      primaryColors: primaryColors.map((c: any) => c.hex || c).filter(Boolean).slice(0, 3),
      headingFont,
      bodyFont,
    };

    // Verbal Identity
    const toneAdjectives = getItems(comprehensive.verbal_identity?.tone_of_voice?.adjectives) as string[];
    const verbalIdentity = {
      tagline: getValue(comprehensive.verbal_identity?.tagline),
      elevatorPitch: getValue(comprehensive.verbal_identity?.elevator_pitch),
      toneAdjectives: toneAdjectives.slice(0, 5),
    };

    // Audience Positioning
    const primaryICP = getValue(comprehensive.audience_positioning?.primary_icp);
    const icpText = primaryICP && typeof primaryICP === 'object'
      ? `${primaryICP.role || primaryICP.title || 'Professional'} at ${primaryICP.company_type || primaryICP.industry || 'Company'}`
      : primaryICP;
    const problemsSolved = getItems(comprehensive.audience_positioning?.problems_solved) as string[];

    const audiencePositioning = {
      primaryICP: icpText,
      problemsSolved: problemsSolved.slice(0, 3),
      category: getValue(comprehensive.audience_positioning?.category),
    };

    // Proof
    const proof = {
      testimonials: getItems(comprehensive.proof_trust?.testimonials).length,
      caseStudies: getItems(comprehensive.proof_trust?.case_studies).length,
      clientLogos: getItems(comprehensive.proof_trust?.client_logos).length,
      awards: getItems(comprehensive.proof_trust?.awards_certifications).length,
    };

    return {
      meta,
      visualIdentity,
      verbalIdentity,
      audiencePositioning,
      proof,
    };
  }

  private static buildCriticalGaps(comprehensive: any): UICriticalGap[] {
    if (!comprehensive?.gaps_summary?.critical_gaps) {
      return [];
    }

    return comprehensive.gaps_summary.critical_gaps.map((gap: any) => {
      // Parse field path (e.g., 'verbal_identity.tagline')
      const parts = gap.field.split('.');
      const sectionId = parts[0];
      const fieldId = parts.slice(1).join('.');

      return {
        fieldId: gap.field,
        fieldLabel: this.humanizeFieldName(fieldId),
        sectionLabel: SECTION_LABELS[sectionId] || sectionId,
        severity: gap.severity || 'critical',
        recommendation: gap.recommendation || `Add ${this.humanizeFieldName(fieldId)}`,
      };
    });
  }

  private static async buildRoadmapSummary(
    profileId: number,
    roadmap: any
  ): Promise<RoadmapSummaryView> {
    // Get quick win tasks from database
    const quickWinTasks = await db.select()
      .from(brandRoadmapTasks)
      .where(and(
        eq(brandRoadmapTasks.brandProfileId, profileId),
        eq(brandRoadmapTasks.isQuickWin, 1)
      ))
      .limit(10);

    const quickWins: RoadmapTaskSummary[] = quickWinTasks.map((task: any) => ({
      id: task.id,
      title: task.title || '',
      description: task.description || '',
      category: task.category || 'other',
      impact: task.impact || 'medium',
      effort: task.effort || 'medium',
      status: task.status || 'pending',
      acceptanceCriteria: task.acceptanceCriteria || undefined,
    }));

    // Get campaigns with task counts
    const campaigns = await db.select()
      .from(brandRoadmapCampaigns)
      .where(eq(brandRoadmapCampaigns.brandProfileId, profileId));

    const campaignSummaries: RoadmapCampaignSummary[] = await Promise.all(
      campaigns.map(async (campaign: any) => {
        // Count total and completed tasks
        const totalTasks = await db.select({ count: count() })
          .from(brandRoadmapTasks)
          .where(eq(brandRoadmapTasks.campaignId, campaign.id));

        const completedTasks = await db.select({ count: count() })
          .from(brandRoadmapTasks)
          .where(and(
            eq(brandRoadmapTasks.campaignId, campaign.id),
            eq(brandRoadmapTasks.status, 'completed')
          ));

        const total = totalTasks[0]?.count || 0;
        const completed = completedTasks[0]?.count || 0;
        const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          id: campaign.id,
          title: campaign.title || '',
          shortTitle: campaign.shortTitle || '',
          category: campaign.category || '',
          estimatedTimeline: campaign.estimatedTimeline || '',
          completionPercentage,
          totalTasks: total,
          completedTasks: completed,
        };
      })
    );

    return {
      quickWins,
      campaigns: campaignSummaries,
      totalTasks: roadmap?.total_tasks || 0,
      estimatedTimeline: roadmap?.estimated_timeline || '',
    };
  }

  private static humanizeFieldName(fieldName: string): string {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /**
   * List all brand profiles for a user with filtering and pagination
   * Returns lightweight list items for efficient list rendering
   */
  static async listProfiles(
    userId: number,
    filters: {
      persona?: string;
      minScore?: number;
      entityType?: string;
      status?: string;
    },
    sort: string = 'created_at',
    order: 'asc' | 'desc' = 'desc',
    limit: number = 20,
    offset: number = 0
  ): Promise<{ profiles: BrandProfileListItem[]; total: number }> {
    const { gte, desc: descOrder, asc: ascOrder } = await import('drizzle-orm');

    // Build WHERE conditions
    const conditions: any[] = [eq(brandProfiles.userId, userId)];

    if (filters.persona) {
      conditions.push(eq(brandProfiles.persona_id, filters.persona));
    }

    if (filters.minScore !== undefined) {
      conditions.push(gte(brandProfiles.overall_score, filters.minScore));
    }

    if (filters.entityType) {
      conditions.push(eq(brandProfiles.entity_type, filters.entityType));
    }

    if (filters.status) {
      conditions.push(eq(brandProfiles.status, filters.status));
    }

    // Build ORDER BY
    const orderColumn = sort === 'overall_score' ? brandProfiles.overall_score :
                        sort === 'completeness_score' ? brandProfiles.completeness_score :
                        sort === 'brand_name' ? brandProfiles.brand_name :
                        brandProfiles.created_at;

    const orderDirection = order === 'asc' ? ascOrder(orderColumn) : descOrder(orderColumn);

    // Fetch profiles
    const profiles = await db.select()
      .from(brandProfiles)
      .where(and(...conditions))
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db.select({ count: count() })
      .from(brandProfiles)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

    // Build lightweight list items (no heavy processing)
    const listItems: BrandProfileListItem[] = profiles
      .filter((p: any) => p.status === 'complete')
      .map((p: any) => {
        // Extract logo from brand kit if available
        const getValue = getFieldValue;
        const brandKit = p.brandKit;
        const logo = brandKit?.visual_identity?.logos?.primary_logo_url
          ? getValue(brandKit.visual_identity.logos.primary_logo_url)
          : null;

        return {
          id: p.id,
          domain: p.canonical_domain || 'unknown',
          brandName: p.brand_name,
          logo,
          personaId: p.persona_id,
        };
      });

    return {
      profiles: listItems,
      total: typeof total === 'number' ? total : parseInt(total as string, 10),
    };
  }

  /**
   * Update a roadmap task
   */
  static async updateTask(
    taskId: string,
    updates: {
      status?: string;
      acceptanceCriteria?: string;
    }
  ): Promise<RoadmapTaskSummary> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.status) {
      updateData.status = updates.status;
    }

    if (updates.acceptanceCriteria !== undefined) {
      updateData.acceptanceCriteria = updates.acceptanceCriteria;
    }

    const updated = await db.update(brandRoadmapTasks)
      .set(updateData)
      .where(eq(brandRoadmapTasks.id, taskId))
      .returning();

    if (updated.length === 0) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const task = updated[0];

    return {
      id: task.id,
      title: task.title || '',
      description: task.description || '',
      category: task.category || 'other',
      impact: task.impact || 'medium',
      effort: task.effort || 'medium',
      status: task.status || 'pending',
      acceptanceCriteria: task.acceptanceCriteria || undefined,
    };
  }

  /**
   * Bulk update multiple tasks
   */
  static async bulkUpdateTasks(
    taskIds: string[],
    updates: {
      status?: string;
      acceptanceCriteria?: string;
    }
  ): Promise<{ updated: number; tasks: RoadmapTaskSummary[] }> {
    const { inArray } = await import('drizzle-orm');

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.status) {
      updateData.status = updates.status;
    }

    if (updates.acceptanceCriteria !== undefined) {
      updateData.acceptanceCriteria = updates.acceptanceCriteria;
    }

    const updated = await db.update(brandRoadmapTasks)
      .set(updateData)
      .where(inArray(brandRoadmapTasks.id, taskIds))
      .returning();

    const tasks = updated.map((task: any) => ({
      id: task.id,
      title: task.title || '',
      description: task.description || '',
      category: task.category || 'other',
      impact: task.impact || 'medium',
      effort: task.effort || 'medium',
      status: task.status || 'pending',
      acceptanceCriteria: task.acceptanceCriteria || undefined,
    }));

    return {
      updated: updated.length,
      tasks,
    };
  }
}
