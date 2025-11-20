/**
 * Brand Intelligence Service
 *
 * Builds view models for frontend consumption from database data
 */

import { BrandProfile, BrandRoadmapCampaign, BrandRoadmapTask, BrandKit } from '../models';
import { Types } from 'mongoose';
import { toObjectId } from '../utils/mongoHelpers';
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
  static async getSummaryView(profileId: string): Promise<BrandIntelligenceView> {
    // Fetch brand profile by _id
    const profile = await BrandProfile.findById(profileId);

    if (!profile) {
      throw new Error(`Brand profile not found: ${profileId}`);
    }

    // Fetch brand kit from separate collection
    const brandKitDoc = await BrandKit.findOne({ profileId: profileId });

    console.log('Profile data:', {
      name: profile.name,
      domain: profile.domain,
      persona: profile.persona,
      hasScores: !!profile.scores,
      scores: profile.scores
    });

    console.log('Brand kit doc:', {
      found: !!brandKitDoc,
      brand_name: brandKitDoc?.brand_name,
      hasVisualIdentity: !!brandKitDoc?.visual_identity,
      hasVerbalIdentity: !!brandKitDoc?.verbal_identity
    });

    // Build view model from Python v2 structure
    return {
      id: profile._id.toString(),
      domain: profile.domain || 'unknown',
      brandName: profile.name || brandKitDoc?.brand_name || null,

      analysisContext: {
        personaId: profile.persona || null,
        personaLabel: null,
        entityType: profile.type || null,
        businessModel: profile.business_model || null,
        channelOrientation: null,
        completenessScore: 0,
        generatedAt: brandKitDoc?.generated_at?.toISOString() || profile.created_at?.toISOString() || '',
      },

      snapshot: this.buildSnapshotV2(profile, brandKitDoc),
      scores: this.buildScoresViewV2(profile.scores),
      channels: this.buildChannelsViewV2(brandKitDoc),
      brandKitSummary: this.buildBrandKitSummaryV2(brandKitDoc, profile),
      criticalGaps: [],
      roadmapSummary: this.buildRoadmapSummaryV2(profile.roadmap),
    };
  }

  /**
   * Get detail view (full data for deep dive)
   */
  static async getDetailView(profileId: string): Promise<BrandIntelligenceDetailView> {
    const summaryView = await this.getSummaryView(profileId);

    const profile = await BrandProfile.findById(profileId);

    if (!profile) {
      throw new Error(`Brand profile not found: ${profileId}`);
    }

    // Fetch brand kit from separate collection
    const brandKitDoc = await BrandKit.findOne({ profileId: profileId });

    // Python v2 structure - return raw data
    const brandKitData = brandKitDoc ? {
      visual_identity: brandKitDoc.visual_identity,
      verbal_identity: brandKitDoc.verbal_identity,
      proof_trust: brandKitDoc.proof_trust,
      seo: brandKitDoc.seo,
      content: brandKitDoc.content,
      conversion: brandKitDoc.conversion,
      product: brandKitDoc.product
    } : null;

    const profileData = {
      name: profile.name,
      domain: profile.domain,
      url: profile.url,
      type: profile.type,
      business_model: profile.business_model,
      persona: profile.persona,
      logo_url: profile.logo_url,
      favicon_url: profile.favicon_url,
      primary_colors: profile.primary_colors,
      heading_font: profile.heading_font,
      body_font: profile.body_font,
      elevator_pitch_one_liner: profile.elevator_pitch_one_liner,
      value_proposition: profile.value_proposition,
      brand_story: profile.brand_story,
      tone_voice: profile.tone_voice,
      target_customer_profile: profile.target_customer_profile,
      the_problem_it_solves: profile.the_problem_it_solves,
      the_transformation_outcome: profile.the_transformation_outcome,
      scores: profile.scores,
      roadmap: profile.roadmap
    };

    return {
      ...summaryView,
      brandKitUnwrapped: brandKitData,
      profileData: profileData,
      dataQuality: {
        totalFields: 0,
        foundFields: 0,
        inferredFields: 0,
        missingFields: 0,
        averageConfidence: 0,
        sourceBreakdown: {},
        lowConfidenceFields: []
      },
      brandKitRaw: brandKitData,
      roadmapFull: null,
      analysisContextFull: null,
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
    profileId: Types.ObjectId,
    roadmap: any
  ): Promise<RoadmapSummaryView> {
    // Get quick win tasks from database
    const quickWinTasks = await BrandRoadmapTask.find({
      brandProfileId: profileId,
      isQuickWin: 1
    }).limit(10);

    const quickWins: RoadmapTaskSummary[] = quickWinTasks.map((task: any) => ({
      id: task._id,
      title: task.title || '',
      description: task.description || '',
      category: task.category || 'other',
      impact: task.impact || 'medium',
      effort: task.effort || 'medium',
      status: task.status || 'pending',
      acceptanceCriteria: task.acceptanceCriteria || undefined,
    }));

    // Get campaigns with task counts
    const campaigns = await BrandRoadmapCampaign.find({ brandProfileId: profileId });

    const campaignSummaries: RoadmapCampaignSummary[] = await Promise.all(
      campaigns.map(async (campaign: any) => {
        // Count total and completed tasks
        const totalTasks = await BrandRoadmapTask.countDocuments({ campaignId: campaign._id });
        const completedTasks = await BrandRoadmapTask.countDocuments({
          campaignId: campaign._id,
          status: 'completed'
        });

        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          id: campaign._id,
          title: campaign.title || '',
          shortTitle: campaign.shortTitle || '',
          category: campaign.category || '',
          estimatedTimeline: campaign.estimatedTimeline || '',
          completionPercentage,
          totalTasks,
          completedTasks,
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
    userId: string | number,
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
    // Build query filter
    // userId is stored as string in MongoDB (from Python backend), not ObjectId
    // brand_profiles collection only contains completed profiles (no status field needed)
    const query: any = {
      userId: userId.toString()
    };

    if (filters.persona) {
      query.persona_id = filters.persona;
    }

    if (filters.minScore !== undefined) {
      query.overall_score = { $gte: filters.minScore };
    }

    if (filters.entityType) {
      query.entity_type = filters.entityType;
    }

    // Build sort
    const sortObj: any = {};
    const sortField = sort === 'overall_score' ? 'overall_score' :
                      sort === 'completeness_score' ? 'completeness_score' :
                      sort === 'brand_name' ? 'brand_name' :
                      'created_at';
    sortObj[sortField] = order === 'asc' ? 1 : -1;

    // Fetch profiles
    const profiles = await BrandProfile.find(query)
      .sort(sortObj)
      .skip(offset)
      .limit(limit);

    // Get total count
    const total = await BrandProfile.countDocuments(query);

    // Fetch brand kits for all profiles
    const profileIds = profiles.map((p: any) => p._id.toString());
    const brandKits = await BrandKit.find({ profileId: { $in: profileIds } })
      .select('profileId kitData')
      .lean();

    // Create a map for quick lookup
    const brandKitMap = new Map(
      brandKits.map((kit: any) => [kit.profileId, kit.kitData])
    );

    // Build lightweight list items (no heavy processing)
    const getValue = getFieldValue;
    const listItems: BrandProfileListItem[] = profiles
      .map((p: any) => {
        // Get brand kit from separate collection
        const kitData = brandKitMap.get(p._id.toString());

        // Extract logo from brand kit if available
        const logo = kitData?.external_presence?.visual_identity_v3?.logos?.primary_logo_url
          ? getValue(kitData.external_presence.visual_identity_v3.logos.primary_logo_url)
          : null;

        return {
          id: p._id.toString(),
          domain: p.domain || 'unknown',
          brandName: p.brand_name,
          logo,
          personaId: p.persona_id,
        };
      });

    return {
      profiles: listItems,
      total,
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

    const task = await BrandRoadmapTask.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true }
    );

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    return {
      id: task._id,
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
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.status) {
      updateData.status = updates.status;
    }

    if (updates.acceptanceCriteria !== undefined) {
      updateData.acceptanceCriteria = updates.acceptanceCriteria;
    }

    await BrandRoadmapTask.updateMany(
      { _id: { $in: taskIds } },
      updateData
    );

    // Fetch updated tasks
    const tasks = await BrandRoadmapTask.find({ _id: { $in: taskIds } });

    const taskSummaries = tasks.map((task: any) => ({
      id: task._id,
      title: task.title || '',
      description: task.description || '',
      category: task.category || 'other',
      impact: task.impact || 'medium',
      effort: task.effort || 'medium',
      status: task.status || 'pending',
      acceptanceCriteria: task.acceptanceCriteria || undefined,
    }));

    return {
      updated: tasks.length,
      tasks: taskSummaries,
    };
  }

  /**
   * V2 Helper methods for Python flat structure
   */
  private static buildScoresViewV2(scores: any): BrandScoresView {
    if (!scores) {
      return {
        overall: null,
        dimensions: {}
      };
    }

    return {
      overall: scores.overall || null,
      dimensions: {
        visual_clarity: scores.visual_clarity || null,
        verbal_clarity: scores.verbal_clarity || null,
        positioning: scores.positioning || null,
        presence: scores.presence || null,
        conversion_trust: scores.conversion_trust || null
      }
    };
  }

  private static buildSnapshotV2(profile: any, brandKit: any): any {
    return {
      strengths: [],
      risks: [],
      fieldsFound: 0,
      fieldsInferred: 0,
      fieldsMissing: 0,
      totalCriticalGaps: 0,
      sectionCompleteness: {},
      evidenceSummary: {
        sitePages: 0,
        screenshots: 0,
        searchResults: 0
      }
    };
  }

  private static buildChannelsViewV2(brandKit: any): ChannelsOverviewView {
    const hasBlog = brandKit?.content?.has_blog || false;
    const hasSocial = false; // TODO: check social profiles
    const hasReviews = false; // TODO: check reviews

    const channels = [
      {
        id: 'website',
        label: 'Website',
        present: true,
        details: 'Domain'
      },
      {
        id: 'blog',
        label: 'Blog',
        present: hasBlog,
        ...(hasBlog && { details: brandKit?.content?.blog_url })
      },
      {
        id: 'social',
        label: 'Social Media',
        present: hasSocial
      },
      {
        id: 'review_sites',
        label: 'Review Sites',
        present: hasReviews
      }
    ];

    const presentChannels = channels.filter(c => c.present).map(c => c.label);
    const missingChannels = channels.filter(c => !c.present).map(c => c.label);

    return {
      channels: channels as ChannelStatus[],
      summaryText: `Channels used: ${presentChannels.join(', ')}. Missing: ${missingChannels.join(', ')}.`
    };
  }

  private static buildRoadmapSummaryV2(roadmap: any): RoadmapSummaryView {
    if (!roadmap || !roadmap.tasks) {
      return {
        quickWins: [],
        campaigns: [],
        totalTasks: 0,
        estimatedTimeline: ''
      };
    }

    // Get quick wins (type === 'quick_win')
    const quickWins = roadmap.tasks
      .filter((t: any) => t.type === 'quick_win')
      .slice(0, 5)
      .map((t: any) => ({
        id: t.task_id,
        title: t.title,
        description: t.description,
        priority: t.priority_score,
        status: t.status || 'pending',
        category: t.category,
        effort: t.effort,
        impact: t.impact
      }));

    // Get projects
    const projects = roadmap.tasks
      .filter((t: any) => t.type === 'project')
      .map((t: any) => ({
        id: t.task_id,
        title: t.title,
        description: t.description,
        priority: t.priority_score,
        status: t.status || 'pending',
        category: t.category,
        effort: t.effort,
        impact: t.impact
      }));

    return {
      quickWins,
      campaigns: projects,
      totalTasks: roadmap.total_count || roadmap.tasks.length,
      estimatedTimeline: `${roadmap.quick_wins_count || 0} quick wins, ${roadmap.projects_count || 0} projects`
    };
  }

  private static buildBrandKitSummaryV2(brandKit: any, profile?: any): BrandKitSummaryView {
    return {
      meta: {
        brandName: profile?.name || brandKit?.brand_name || null,
        domain: profile?.domain || brandKit?.domain || null,
        industry: null,
        companyType: profile?.type || null
      },
      visualIdentity: {
        primaryLogo: profile?.logo_url || brandKit?.visual_identity?.logo_url || null,
        primaryColors: profile?.primary_colors || brandKit?.visual_identity?.colors?.primary || [],
        headingFont: profile?.heading_font || brandKit?.visual_identity?.typography?.heading || null,
        bodyFont: profile?.body_font || brandKit?.visual_identity?.typography?.body || null
      },
      verbalIdentity: {
        tagline: brandKit?.verbal_identity?.tagline || null,
        elevatorPitch: profile?.elevator_pitch_one_liner || brandKit?.verbal_identity?.elevator_pitch || null,
        toneAdjectives: profile?.tone_voice || brandKit?.verbal_identity?.tone_voice || []
      },
      audiencePositioning: {
        primaryICP: profile?.target_customer_profile?.role || null,
        problemsSolved: profile?.the_problem_it_solves || [],
        category: null
      },
      proof: {
        testimonials: brandKit?.proof_trust?.testimonials_count || 0,
        caseStudies: brandKit?.proof_trust?.case_studies_count || 0,
        clientLogos: brandKit?.proof_trust?.client_logos_count || 0,
        awards: brandKit?.proof_trust?.awards_count || 0
      }
    };
  }
}
