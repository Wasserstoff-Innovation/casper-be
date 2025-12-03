/**
 * Brand Intelligence Service
 *
 * Builds view models for frontend consumption from database data.
 * Uses the new schema structure with BrandIntelligenceJob for computed fields.
 */

import {
  BrandProfile,
  BrandRoadmapTask,
  BrandKit,
  BrandSocialProfile,
  BrandIntelligenceJob
} from '../models';
import { toObjectId } from '../utils/mongoHelpers';
import {
  calculateDataQualityMetrics,
  calculateLegacyCompleteness,
  calculateProfileCompleteness,
  buildStrengthsAndRisks,
  buildCriticalGaps
} from '../utils/completenessCalculator';
import {
  BrandIntelligenceView,
  BrandIntelligenceDetailView,
  BrandProfileListItem,
  BrandScoresView,
  ChannelsOverviewView,
  BrandKitSummaryView,
  RoadmapSummaryView,
  UICriticalGap,
  ChannelStatus,
  RoadmapTaskSummary,
  RoadmapCampaignSummary,
  SECTION_LABELS,
  BrandIntelligenceJobView,
} from '../types/brandIntelligence';
import { IStrengthRisk } from '../models/BrandIntelligenceJob';

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
    const brandKitDoc = await BrandKit.findOne({
      $or: [
        { profileId: profileId },
        { brandProfileId: toObjectId(profileId) }
      ]
    });

    // Fetch social profiles
    const socialProfileDoc = await BrandSocialProfile.findOne({ brandProfileId: profileId });

    // Calculate data quality metrics
    const dataQuality = brandKitDoc?.comprehensive
      ? calculateDataQualityMetrics(brandKitDoc.comprehensive)
      : {
          totalFields: 0,
          foundFields: 0,
          inferredFields: 0,
          missingFields: 0,
          manualFields: 0,
          averageConfidence: 0,
          completenessPercentage: calculateLegacyCompleteness(brandKitDoc),
          editedFieldPaths: [],
          by_section: {}
        };

    // Build strengths and risks from scores
    const { strengths, risks } = buildStrengthsAndRisks(profile.scores);

    // Build critical gaps
    const criticalGapsRaw = buildCriticalGaps(brandKitDoc?.comprehensive || null, dataQuality);
    const criticalGaps: UICriticalGap[] = criticalGapsRaw.map(g => ({
      fieldId: g.field,
      fieldLabel: g.fieldLabel,
      sectionLabel: g.sectionLabel,
      severity: g.impact,
      recommendation: g.recommendation
    }));

    // Build view model
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
        completenessScore: dataQuality.completenessPercentage,
        generatedAt: brandKitDoc?.generated_at?.toISOString() || profile.created_at?.toISOString() || '',
      },

      snapshot: {
        overallScore: profile.scores?.overall || null,
        strengths: strengths.map(s => ({
          id: s.dimension,
          label: s.label,
          value: s.score,
          description: s.description
        })),
        risks: risks.map(r => ({
          id: r.dimension,
          label: r.label,
          value: r.score,
          description: r.description
        })),
        fieldsFound: dataQuality.foundFields,
        fieldsInferred: dataQuality.inferredFields,
        fieldsMissing: dataQuality.missingFields,
        fieldsManual: dataQuality.manualFields,
        totalFields: dataQuality.totalFields,
        totalCriticalGaps: criticalGaps.filter(g => g.severity === 'critical').length,
        overallCompleteness: dataQuality.completenessPercentage,
        sectionCompleteness: Object.fromEntries(
          Object.entries(dataQuality.by_section || {}).map(([k, v]: [string, any]) => [k, v.completeness])
        ),
        evidenceSummary: {
          sitePages: 0,
          screenshots: 0,
          searchResults: 0
        }
      },

      scores: this.buildScoresView(profile.scores),
      channels: this.buildChannelsView(brandKitDoc, socialProfileDoc),
      brandKitSummary: this.buildBrandKitSummary(brandKitDoc, profile),
      criticalGaps,
      roadmapSummary: this.buildRoadmapSummary(profile.roadmap),
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
    const brandKitDoc = await BrandKit.findOne({
      $or: [
        { profileId: profileId },
        { brandProfileId: toObjectId(profileId) }
      ]
    });

    // Fetch social profiles document
    const socialProfilesDoc = await BrandSocialProfile.findOne({ brandProfileId: profileId }).lean();

    // Calculate detailed data quality
    const dataQuality = brandKitDoc?.comprehensive
      ? calculateDataQualityMetrics(brandKitDoc.comprehensive)
      : {
          totalFields: 0,
          foundFields: 0,
          inferredFields: 0,
          missingFields: 0,
          manualFields: 0,
          averageConfidence: 0,
          completenessPercentage: calculateLegacyCompleteness(brandKitDoc),
          editedFieldPaths: [],
          by_section: {}
        };

    // Build brand kit data (prefer comprehensive, fallback to legacy)
    const brandKitData = brandKitDoc?.comprehensive || (brandKitDoc ? {
      visual_identity: brandKitDoc.visual_identity,
      verbal_identity: brandKitDoc.verbal_identity,
      proof_trust: brandKitDoc.proof_trust,
      seo: brandKitDoc.seo,
      content: brandKitDoc.content,
      conversion: brandKitDoc.conversion,
      product: brandKitDoc.product
    } : null);

    // Build profile data for frontend
    // Note: favicon_url, elevator_pitch, value_proposition come from brandKit.comprehensive
    const comprehensive = brandKitDoc?.comprehensive;
    const profileData = {
      name: profile.name,
      domain: profile.domain,
      url: profile.url,
      type: profile.type,
      business_model: profile.business_model,
      persona: profile.persona,
      logo_url: profile.logo_url,
      // Get from brand kit comprehensive (single source of truth)
      favicon_url: comprehensive?.visual_identity?.logos?.favicon_url?.value || null,
      elevator_pitch_one_liner: comprehensive?.verbal_identity?.elevator_pitch?.value || null,
      value_proposition: comprehensive?.verbal_identity?.value_proposition?.value || null,
      target_customer_profile: profile.target_customer_profile,
      scores: profile.scores,
      roadmap: profile.roadmap
    };

    return {
      ...summaryView,
      brandKitUnwrapped: brandKitData,
      profileData: profileData,
      socialProfiles: socialProfilesDoc ? {
        profiles: (socialProfilesDoc as any).profiles || [],
        platforms_found: (socialProfilesDoc as any).platforms_found || [],
        total_found: (socialProfilesDoc as any).total_found || 0,
        total_platforms: (socialProfilesDoc as any).total_platforms || 0,
        total_followers: (socialProfilesDoc as any).total_followers
      } : null,
      dataQuality: {
        totalFields: dataQuality.totalFields,
        foundFields: dataQuality.foundFields,
        inferredFields: dataQuality.inferredFields,
        missingFields: dataQuality.missingFields,
        manualFields: dataQuality.manualFields,
        averageConfidence: dataQuality.averageConfidence,
        completenessPercentage: dataQuality.completenessPercentage,
        sourceBreakdown: {},
        lowConfidenceFields: [],
        by_section: dataQuality.by_section ? Object.fromEntries(
          Object.entries(dataQuality.by_section).map(([sectionId, data]: [string, any]) => [
            sectionId,
            {
              sectionId,
              sectionLabel: SECTION_LABELS[sectionId] || sectionId,
              completeness: data.completeness,
              foundCount: data.found_count,
              inferredCount: data.inferred_count,
              missingCount: data.missing_count,
              manualCount: data.manual_count
            }
          ])
        ) : undefined
      },
      brandKitRaw: brandKitDoc?.comprehensive || brandKitData,
      roadmapFull: null,
      analysisContextFull: null,
    };
  }

  /**
   * Get job view from brand_intelligence_jobs collection
   */
  static async getJobView(jobId: string): Promise<BrandIntelligenceJobView | null> {
    const job = await BrandIntelligenceJob.findById(jobId);

    if (!job) {
      return null;
    }

    return {
      id: job._id.toString(),
      url: job.url,
      status: job.status,
      pipeline: job.pipeline,
      snapshot: job.snapshot ? {
        strengths: job.snapshot.strengths?.map((s: IStrengthRisk) => s.description || `${s.label} (${s.score}/100)`) || [],
        risks: job.snapshot.risks?.map((r: IStrengthRisk) => r.description || `${r.label} (${r.score}/100)`) || [],
        fieldsFound: job.snapshot.fieldsFound || 0,
        fieldsInferred: job.snapshot.fieldsInferred || 0,
        fieldsMissing: job.snapshot.fieldsMissing || 0,
        fieldsManual: job.snapshot.fieldsManual || 0,
        totalFields: job.snapshot.totalFields || 0,
        overallCompleteness: job.snapshot.overallCompleteness || 0,
        sectionCompleteness: job.snapshot.sectionCompleteness || {}
      } : undefined,
      criticalGaps: job.criticalGaps,
      dataQuality: job.dataQuality ? {
        completeness: job.dataQuality.completeness,
        accuracy: job.dataQuality.accuracy,
        freshness: job.dataQuality.freshness,
        overallQuality: job.dataQuality.overallQuality,
        averageConfidence: job.dataQuality.averageConfidence
      } : undefined,
      scores: job.scores,
      brand: job.brand,
      roadmap: job.roadmap,
      context: job.context,
      channels: job.channels,
      profileId: job.profileId,
      brandKitId: job.brandKitId,
      socialProfileIds: job.socialProfileIds,
      progress: job.progress ? {
        ...job.progress,
        // DBProgress already has string dates from brand.types.ts
        phase_started_at: job.progress.phase_started_at,
        last_updated: job.progress.last_updated
      } : undefined,
      created_at: job.created_at.toISOString(),
      completed_at: job.completed_at?.toISOString(),
      last_updated: job.last_updated.toISOString(),
      error: job.error
    };
  }

  /**
   * Update job with computed fields after analysis completion
   */
  static async updateJobComputedFields(jobId: string): Promise<void> {
    const job = await BrandIntelligenceJob.findById(jobId);
    if (!job || !job.profileId) return;

    // Get profile and brand kit
    const profile = await BrandProfile.findById(job.profileId);
    const brandKit = await BrandKit.findOne({
      $or: [
        { profileId: job.profileId },
        { brandProfileId: toObjectId(job.profileId) }
      ]
    });
    const socialProfiles = await BrandSocialProfile.findOne({ brandProfileId: job.profileId });

    if (!profile) return;

    // Calculate data quality
    const dataQuality = brandKit?.comprehensive
      ? calculateDataQualityMetrics(brandKit.comprehensive)
      : {
          totalFields: 0,
          foundFields: 0,
          inferredFields: 0,
          missingFields: 0,
          manualFields: 0,
          averageConfidence: 0,
          completenessPercentage: calculateLegacyCompleteness(brandKit),
          editedFieldPaths: [],
          by_section: {}
        };

    // Build strengths and risks
    const { strengths, risks } = buildStrengthsAndRisks(profile.scores);

    // Build critical gaps
    const criticalGapsRaw = buildCriticalGaps(brandKit?.comprehensive || null, dataQuality);

    // Calculate roadmap completion
    const totalTasks = profile.roadmap?.total_count || 0;
    const completedTasks = profile.roadmap?.tasks?.filter((t: any) => t.status === 'completed').length || 0;

    // Build channels
    const channels = this.buildChannelsView(brandKit, socialProfiles);

    // Update job with computed fields
    await BrandIntelligenceJob.findByIdAndUpdate(jobId, {
      snapshot: {
        strengths,
        risks,
        fieldsFound: dataQuality.foundFields,
        fieldsInferred: dataQuality.inferredFields,
        fieldsMissing: dataQuality.missingFields,
        fieldsManual: dataQuality.manualFields,
        totalFields: dataQuality.totalFields,
        overallCompleteness: dataQuality.completenessPercentage,
        sectionCompleteness: Object.fromEntries(
          Object.entries(dataQuality.by_section || {}).map(([k, v]: [string, any]) => [k, v.completeness])
        ),
        evidenceSummary: {
          sitePages: 0,
          screenshots: 0,
          searchResults: 0
        }
      },
      criticalGaps: criticalGapsRaw,
      dataQuality: {
        completeness: dataQuality.completenessPercentage,
        accuracy: 85, // Default accuracy
        freshness: 100, // Just analyzed
        overallQuality: Math.round((dataQuality.completenessPercentage + 85 + 100) / 3),
        averageConfidence: dataQuality.averageConfidence,
        sourceBreakdown: {},
        lowConfidenceFields: []
      },
      scores: profile.scores,
      brand: {
        name: profile.name,
        domain: profile.domain,
        url: profile.url,
        logo_url: profile.logo_url,
        favicon_url: brandKit?.comprehensive?.visual_identity?.logos?.favicon_url?.value || null
      },
      roadmap: {
        quick_wins_count: profile.roadmap?.quick_wins_count || 0,
        projects_count: profile.roadmap?.projects_count || 0,
        long_term_count: profile.roadmap?.long_term_count || 0,
        total_count: totalTasks,
        completed_count: completedTasks,
        completion_percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      context: {
        persona: profile.persona,
        persona_label: null,
        entity_type: profile.type,
        business_model: profile.business_model,
        channel_orientation: null,
        url: profile.url || `https://${profile.domain}`
      },
      channels: channels.channels,
      brandKitId: brandKit?._id?.toString(),
      socialProfileIds: socialProfiles ? [socialProfiles._id.toString()] : [],
      last_updated: new Date()
    });
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  private static buildScoresView(scores: any): BrandScoresView {
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

  private static buildChannelsView(brandKit: any, socialProfiles: any): ChannelsOverviewView {
    const channels: ChannelStatus[] = [];

    // Website (always present)
    channels.push({
      id: 'website',
      label: 'Website',
      present: true,
      details: 'Domain'
    });

    // Blog
    const hasBlog = brandKit?.content?.has_blog ||
                    brandKit?.comprehensive?.content_assets?.blog_present?.value === true;
    channels.push({
      id: 'blog',
      label: 'Blog',
      present: hasBlog,
      ...(hasBlog && { details: brandKit?.content?.blog_url || 'Active' })
    });

    // Social Media
    const hasSocial = socialProfiles && socialProfiles.total_found > 0;
    if (hasSocial && socialProfiles.profiles) {
      // Add individual social platforms
      for (const profile of socialProfiles.profiles) {
        if (profile.status === 'found' || profile.status === 'verified' || profile.status === 'manual') {
          channels.push({
            id: profile.platform.toLowerCase(),
            label: profile.platform,
            present: true,
            details: profile.followers_count ? `${profile.followers_count} followers` : undefined,
            urls: profile.url ? [profile.url] : undefined
          });
        }
      }
    } else {
      channels.push({
        id: 'social',
        label: 'Social Media',
        present: false
      });
    }

    // Review Sites
    const hasReviews = brandKit?.proof_trust?.reviews_count > 0 ||
                       (brandKit?.comprehensive?.proof_trust?.third_party_reviews?.items?.length || 0) > 0;
    channels.push({
      id: 'review_sites',
      label: 'Review Sites',
      present: hasReviews,
      ...(hasReviews && { details: `${brandKit?.proof_trust?.reviews_count || 0} reviews` })
    });

    // Build summary text
    const presentChannels = channels.filter(c => c.present).map(c => c.label);
    const missingChannels = channels.filter(c => !c.present).map(c => c.label);

    return {
      channels,
      summaryText: `Channels used: ${presentChannels.join(', ') || 'None'}. ${
        missingChannels.length > 0 ? `Missing: ${missingChannels.join(', ')}.` : ''
      }`
    };
  }

  private static buildBrandKitSummary(brandKit: any, profile?: any): BrandKitSummaryView {
    // Try comprehensive first, then legacy
    const comprehensive = brandKit?.comprehensive;

    if (comprehensive) {
      return {
        meta: {
          brandName: comprehensive.meta?.brand_name?.value || profile?.name || null,
          domain: comprehensive.meta?.canonical_domain?.value || profile?.domain || null,
          industry: comprehensive.meta?.industry?.value || null,
          companyType: comprehensive.meta?.company_type?.value || profile?.type || null
        },
        visualIdentity: {
          primaryLogo: comprehensive.visual_identity?.logos?.primary_logo_url?.value || profile?.logo_url || null,
          primaryColors: comprehensive.visual_identity?.color_system?.primary_colors?.items?.map((c: any) => c.hex) || [],
          headingFont: comprehensive.visual_identity?.typography?.heading_font?.value?.name || null,
          bodyFont: comprehensive.visual_identity?.typography?.body_font?.value?.name || null
        },
        verbalIdentity: {
          tagline: comprehensive.verbal_identity?.tagline?.value || null,
          elevatorPitch: comprehensive.verbal_identity?.elevator_pitch?.value || profile?.elevator_pitch_one_liner || null,
          toneAdjectives: comprehensive.verbal_identity?.tone_of_voice?.adjectives?.items || []
        },
        audiencePositioning: {
          primaryICP: comprehensive.audience_positioning?.primary_icp?.value
            ? `${comprehensive.audience_positioning.primary_icp.value.role} at ${comprehensive.audience_positioning.primary_icp.value.company_type}`
            : (profile?.target_customer_profile?.role || null),
          problemsSolved: comprehensive.audience_positioning?.problems_solved?.items?.slice(0, 3) || [],
          category: comprehensive.audience_positioning?.category?.value || null
        },
        proof: {
          testimonials: comprehensive.proof_trust?.testimonials?.items?.length || 0,
          caseStudies: comprehensive.proof_trust?.case_studies?.items?.length || 0,
          clientLogos: comprehensive.proof_trust?.client_logos?.items?.length || 0,
          awards: comprehensive.proof_trust?.awards_certifications?.items?.length || 0
        }
      };
    }

    // Legacy fallback
    return {
      meta: {
        brandName: profile?.name || brandKit?.brand_name || null,
        domain: profile?.domain || brandKit?.domain || null,
        industry: null,
        companyType: profile?.type || null
      },
      visualIdentity: {
        primaryLogo: profile?.logo_url || brandKit?.visual_identity?.logo_url || null,
        primaryColors: brandKit?.visual_identity?.colors?.primary || [],
        headingFont: brandKit?.visual_identity?.typography?.heading || null,
        bodyFont: brandKit?.visual_identity?.typography?.body || null
      },
      verbalIdentity: {
        tagline: brandKit?.verbal_identity?.tagline || null,
        elevatorPitch: profile?.elevator_pitch_one_liner || brandKit?.verbal_identity?.elevator_pitch || null,
        toneAdjectives: brandKit?.verbal_identity?.tone_voice || []
      },
      audiencePositioning: {
        primaryICP: profile?.target_customer_profile?.role || null,
        problemsSolved: [],
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

  private static buildRoadmapSummary(roadmap: any): RoadmapSummaryView {
    if (!roadmap || !roadmap.tasks) {
      return {
        quickWins: [],
        campaigns: [],
        totalTasks: 0,
        completedTasks: 0,
        completionPercentage: 0,
        estimatedTimeline: ''
      };
    }

    const tasks = roadmap.tasks || [];
    const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;

    // Get quick wins (type === 'quick_win')
    const quickWins: RoadmapTaskSummary[] = tasks
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
    const campaigns: RoadmapCampaignSummary[] = tasks
      .filter((t: any) => t.type === 'project')
      .map((t: any) => ({
        id: t.task_id,
        title: t.title,
        shortTitle: t.title?.substring(0, 30) || '',
        description: t.description,
        priority: t.priority_score,
        status: t.status || 'pending',
        category: t.category,
        effort: t.effort,
        impact: t.impact,
        estimatedTimeline: '',
        completionPercentage: t.status === 'completed' ? 100 : 0,
        totalTasks: 1,
        completedTasks: t.status === 'completed' ? 1 : 0
      }));

    return {
      quickWins,
      campaigns,
      totalTasks: roadmap.total_count || tasks.length,
      completedTasks,
      completionPercentage: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
      estimatedTimeline: `${roadmap.quick_wins_count || 0} quick wins, ${roadmap.projects_count || 0} projects`
    };
  }

  /**
   * List all brand profiles for a user with filtering and pagination
   * Fetches data from both brand_profiles AND brand_kits (single source of truth)
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
    const query: any = {
      userId: userId.toString()
    };

    if (filters.persona) {
      query.persona = filters.persona;
    }

    if (filters.minScore !== undefined) {
      query.overall_score = { $gte: filters.minScore };
    }

    if (filters.entityType) {
      query.type = filters.entityType;
    }

    // Build sort
    const sortObj: any = {};
    const sortField = sort === 'overall_score' ? 'overall_score' :
                      sort === 'completeness_score' ? 'completeness_score' :
                      sort === 'brand_name' ? 'name' :
                      'created_at';
    sortObj[sortField] = order === 'asc' ? 1 : -1;

    // Fetch profiles
    const profiles = await BrandProfile.find(query)
      .sort(sortObj)
      .skip(offset)
      .limit(limit)
      .lean();

    // Get total count
    const total = await BrandProfile.countDocuments(query);

    // Fetch brand kits for these profiles to get the actual data
    const profileIds = profiles.map((p: any) => p._id.toString());
    const brandKits = await BrandKit.find({
      $or: [
        { profileId: { $in: profileIds } },
        { brandProfileId: { $in: profileIds.map(id => toObjectId(id)) } }
      ]
    }).lean();

    // Create a map of profileId -> brandKit for quick lookup
    const brandKitMap = new Map<string, any>();
    for (const kit of brandKits) {
      const profileId = kit.profileId || kit.brandProfileId?.toString();
      if (profileId) {
        brandKitMap.set(profileId, kit);
      }
    }

    // Build list items with data from both profile AND brand kit
    const listItems: BrandProfileListItem[] = profiles.map((p: any) => {
      const profileId = p._id.toString();
      const brandKit = brandKitMap.get(profileId);
      const comprehensive = brandKit?.comprehensive;

      // Get data from brand kit (single source of truth), fallback to profile
      const brandName = comprehensive?.meta?.brand_name?.value ||
                        brandKit?.brand_name ||
                        p.name ||
                        null;

      const logoUrl = comprehensive?.visual_identity?.logos?.primary_logo_url?.value ||
                      p.logo_url ||
                      null;

      const persona = p.persona || null;

      // Calculate completeness from brand kit data
      let completeness = p.completeness_score || 0;
      if (comprehensive && !p.completeness_score) {
        const dataQuality = calculateDataQualityMetrics(comprehensive);
        completeness = dataQuality.completenessPercentage;
      }

      const overallScore = p.scores?.overall ?? p.overall_score ?? null;

      return {
        id: profileId,
        domain: p.domain || 'unknown',
        brandName,
        logo: logoUrl,
        personaId: persona,
        completeness,
        overallScore
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
}
