/**
 * Brand Intelligence View Models
 *
 * These types define the contract between Node backend and frontend.
 * They are lightweight, optimized payloads extracted from the comprehensive JSONB data.
 */

// ============================================================================
// Common Types
// ============================================================================

export interface StrengthRisk {
  id: string;            // dimension key (e.g., 'visual_clarity')
  label: string;         // human-readable (e.g., 'Visual Clarity')
  value: number;         // 0-100 score
  status?: string;       // 'scored' | 'not_applicable' | 'insufficient_data'
  description?: string;  // e.g., 'Strong visual identity (75/100)'
}

export interface ChannelStatus {
  id: string;            // "website" | "blog" | "linkedin" | "twitter" | "review_sites"
  label: string;         // "Website" | "Blog" | "LinkedIn"
  present: boolean;      // true if found/inferred
  details?: string;      // e.g. "4 pages", "G2 with 12 reviews"
  urls?: string[];       // URLs for this channel
}

export interface UICriticalGap {
  fieldId: string;       // 'verbal_identity.tagline'
  fieldLabel: string;    // 'Tagline'
  sectionLabel: string;  // 'Verbal Identity'
  severity: 'critical' | 'important' | 'high' | 'medium' | 'low';
  recommendation: string;
  relatedCampaignId?: string; // Optional link to campaign that addresses this
}

// ============================================================================
// List Item (ultra-lightweight for list views)
// ============================================================================

export interface BrandProfileListItem {
  id: string | number;      // brand_profile.id (MongoDB: string, PostgreSQL: number)
  domain: string;
  brandName: string | null;
  logo: string | null;      // primary logo URL
  personaId: string | null;
  completeness?: number;    // 0-100 percentage
  overallScore?: number;    // 0-100 score
}

// ============================================================================
// Summary View (for drawer / list)
// ============================================================================

export interface BrandIntelligenceView {
  id: string | number;      // brand_profile.id (MongoDB: string, PostgreSQL: number)
  domain: string;
  brandName: string | null;

  analysisContext: {
    personaId: string | null;
    personaLabel: string | null;
    entityType: string | null;
    businessModel: string | null;
    channelOrientation: string | null;
    completenessScore: number;  // 0-100
    generatedAt: string;        // ISO timestamp
  };

  snapshot: {
    overallScore: number | null;
    strengths: StrengthRisk[];    // Top 3-5 dimensions with high scores
    risks: StrengthRisk[];        // Bottom 3-5 dimensions or critical gaps
    fieldsFound: number;
    fieldsInferred: number;
    fieldsMissing: number;
    fieldsManual: number;
    totalFields: number;
    totalCriticalGaps: number;
    overallCompleteness: number;  // 0-100
    sectionCompleteness: Record<string, number>; // 'meta' -> 67, 'visual_identity' -> 45
    evidenceSummary: {
      sitePages: number;
      screenshots: number;
      searchResults: number;
    };
  };

  scores: BrandScoresView;
  channels: ChannelsOverviewView;
  brandKitSummary: BrandKitSummaryView;   // Top-level sections only
  criticalGaps: UICriticalGap[];
  roadmapSummary: RoadmapSummaryView;     // Campaigns + quick wins, without huge details
}

// ============================================================================
// Detail View (for full report)
// ============================================================================

export interface BrandIntelligenceDetailView extends BrandIntelligenceView {
  // Unwrapped brand kit with values extracted from FieldValue wrappers
  brandKitUnwrapped: any;        // Clean data with metadata for each field

  // Python v2 profile data
  profileData?: any;             // Raw profile data from brand_profiles collection

  // Social profiles
  socialProfiles?: {
    profiles: Array<{
      platform: string;
      handle?: string | null;
      url?: string | null;
      status: string;          // found, not_found, manual, reanalysis, verified
      followers_count?: number;
      verified?: boolean;
      bio?: string | null;
      engagement_rate?: number;
    }>;
    platforms_found: string[];
    total_found: number;
    total_platforms: number;
    total_followers?: number;
  } | null;

  // Data quality information
  dataQuality: {
    totalFields: number;
    foundFields: number;
    inferredFields: number;
    missingFields: number;
    manualFields: number;
    averageConfidence: number;   // 0.0 - 1.0
    completenessPercentage: number;
    sourceBreakdown: Record<string, number>;  // {"homepage": 15, "about_page": 8, ...}
    lowConfidenceFields: Array<{ field: string; confidence: number }>;
    by_section?: Record<string, SectionCompletenessDetail>;
  };

  // Raw comprehensive data (for debugging or advanced use)
  brandKitRaw?: any;             // Full comprehensive JSON with FieldValue wrappers
  roadmapFull?: any;             // Full roadmap with all campaigns/milestones/tasks
  analysisContextFull?: any;     // Full analysis_context from Wisdom Tree
}

// ============================================================================
// Scores View
// ============================================================================

export interface BrandScoresView {
  overall: number | null;  // 0-100
  dimensions: {
    [dimensionId: string]: number | null | {
      value: number | null;
      status: 'scored' | 'not_applicable' | 'insufficient_data';
      label: string;  // Human-readable dimension name
    };
  };
  metadata?: {
    personaId: string;
    calculatedAt: string;
  };
}

// ============================================================================
// Channels Overview
// ============================================================================

export interface ChannelsOverviewView {
  channels: ChannelStatus[];
  summaryText: string;  // e.g., "Channels used: Website, LinkedIn. Missing: Blog, Review sites."
}

// ============================================================================
// Brand Kit Summary (lightweight)
// ============================================================================

export interface BrandKitSummaryView {
  meta: {
    brandName: string | null;
    domain: string | null;
    industry: string | null;
    companyType: string | null;
  };

  visualIdentity: {
    primaryLogo: string | null;
    primaryColors: string[];  // hex codes
    headingFont: string | null;
    bodyFont: string | null;
  };

  verbalIdentity: {
    tagline: string | null;
    elevatorPitch: string | null;
    toneAdjectives: string[];  // max 5
  };

  audiencePositioning: {
    primaryICP: string | null;  // role + company type
    problemsSolved: string[];   // max 3
    category: string | null;
  };

  proof: {
    testimonials: number;
    caseStudies: number;
    clientLogos: number;
    awards: number;
  };
}

// ============================================================================
// Roadmap Summary
// ============================================================================

export interface RoadmapSummaryView {
  quickWins: RoadmapTaskSummary[];  // 3-10 tasks
  campaigns: RoadmapCampaignSummary[];
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  estimatedTimeline: string;  // e.g., "5 quick wins, 10 projects"
}

export interface RoadmapTaskSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: string;
  effort: string;
  status: string;
  priority?: number;
  acceptanceCriteria?: string;
}

export interface RoadmapCampaignSummary {
  id: string;
  title: string;
  shortTitle: string;
  category: string;
  estimatedTimeline: string;
  completionPercentage: number;  // based on tasks in DB
  totalTasks: number;
  completedTasks: number;
  priority?: number;
  description?: string;
  impact?: string;
  effort?: string;
  status?: string;
}

// ============================================================================
// Section Completeness Detail
// ============================================================================

export interface SectionCompletenessDetail {
  sectionId: string;
  sectionLabel: string;
  completeness: number;  // 0-100
  foundCount: number;
  inferredCount: number;
  missingCount: number;
  manualCount: number;
  notApplicableCount?: number;
  criticalGaps?: UICriticalGap[];
}

// ============================================================================
// Helper function to map dimension IDs to labels
// ============================================================================

export const DIMENSION_LABELS: Record<string, string> = {
  'visual_clarity': 'Visual Clarity',
  'verbal_clarity': 'Verbal Clarity',
  'positioning': 'Positioning',
  'presence': 'Online Presence',
  'conversion_trust': 'Conversion & Trust',
  'strategic_foundation': 'Strategic Foundation',
  'overall': 'Overall',
};

export const SECTION_LABELS: Record<string, string> = {
  'meta': 'Meta & Audit',
  'visual_identity': 'Visual Identity',
  'verbal_identity': 'Verbal Identity',
  'audience_positioning': 'Audience & Positioning',
  'product_offers': 'Product & Offers',
  'proof_trust': 'Proof & Trust',
  'seo_identity': 'SEO Identity',
  'external_presence': 'External Presence',
  'content_assets': 'Content Assets',
  'competitor_analysis': 'Competitor Analysis',
  'contact_info': 'Contact Info',
  'gaps_summary': 'Gaps Summary',
};

// ============================================================================
// Database row types (for internal use)
// ============================================================================

export interface BrandProfileRow {
  id: number;
  userId: number | null;
  jobId: string | null;
  profileId: string | null;
  data: any;
  brandKit: any;
  brandScores: any;
  brandRoadmap: any;
  analysis_context: any;
  status: string | null;

  // Summary columns
  canonical_domain: string | null;
  brand_name: string | null;
  persona_id: string | null;
  entity_type: string | null;
  business_model: string | null;
  channel_orientation: string | null;
  overall_score: number | null;
  completeness_score: number | null;
  total_critical_gaps: number | null;
  has_social_profiles: number | null;
  has_blog: number | null;
  has_review_sites: number | null;

  created_at: Date | null;
  updated_at: Date | null;
}

// ============================================================================
// Job Status / Enhanced Progress Tracking
// ============================================================================

export type JobStatus = 'queued' | 'running' | 'complete' | 'failed';
export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface SubProgressInfo {
  current: number;           // Current module index (1-based)
  total: number;             // Total modules to run
  current_name: string;      // Module id, e.g., "seo_content"
  current_label?: string;    // Human label, e.g., "SEO & Content"
  modules_completed: string[];
  modules_pending: string[];
}

export interface EnhancedJobProgress {
  progress_percentage: number;          // 0-100
  current_phase: string;                // "modules_execution"
  current_phase_label: string;          // "Running analysis modules"
  phase_status: PhaseStatus;            // "in_progress", etc.
  phase_details?: string;               // Free-text details

  // Enhanced tracking from Python backend
  current_step: number;                 // e.g., 7
  total_steps: number;                  // e.g., 10
  step_label: string;                   // "7/10"
  current_task: string;                 // "Analyzing SEO & Content..."

  sub_progress?: SubProgressInfo;
  phase_started_at?: string;            // ISO timestamp
  last_updated?: string;                // ISO timestamp
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;

  // Progress fields (present when job is running/queued)
  progress_percentage?: number;         // Legacy convenience field
  current_phase?: string;
  current_phase_label?: string;
  phase_status?: PhaseStatus;
  phase_details?: string;

  // Enhanced progress structure (Python backend v2)
  progress?: EnhancedJobProgress;

  // Result (present when status === 'complete')
  result?: {
    profile_id: string;
    brand_kit_id?: string;
    social_profile_ids?: string[];
    tasks_count?: number;
    scores?: {
      overall: number;
      visual_clarity: number;
      verbal_clarity: number;
      positioning: number;
      presence: number;
      conversion_trust: number;
    };
    context?: {
      persona: string;
      entity_type: string;
      url: string;
    };
    // Node.js additions when complete
    brand_kit?: any;
    brand_scores?: any;
    brand_roadmap?: any;
    analysis_context?: any;
  };

  // Error message (present when status === 'failed')
  error?: string | null;
}

// ============================================================================
// Brand Intelligence Job View (from brand_intelligence_jobs collection)
// ============================================================================

export interface BrandIntelligenceJobView {
  id: string;
  url: string;
  status: JobStatus;
  pipeline: string;

  // Computed snapshot
  snapshot?: {
    strengths: string[];
    risks: string[];
    fieldsFound: number;
    fieldsInferred: number;
    fieldsMissing: number;
    fieldsManual: number;
    totalFields: number;
    overallCompleteness: number;
    sectionCompleteness: Record<string, number>;
  };

  // Critical gaps
  criticalGaps?: Array<{
    field: string;
    fieldLabel: string;
    section: string;
    sectionLabel: string;
    impact: 'critical' | 'high' | 'medium' | 'low';
    recommendation: string;
  }>;

  // Data quality
  dataQuality?: {
    completeness: number;
    accuracy: number;
    freshness: number;
    overallQuality: number;
    averageConfidence: number;
  };

  // Scores
  scores?: {
    overall: number | null;
    visual_clarity: number | null;
    verbal_clarity: number | null;
    positioning: number | null;
    presence: number | null;
    conversion_trust: number | null;
  };

  // Brand info
  brand?: {
    name: string | null;
    domain: string;
    url: string | null;
    logo_url: string | null;
  };

  // Roadmap summary
  roadmap?: {
    quick_wins_count: number;
    projects_count: number;
    long_term_count: number;
    total_count: number;
    completed_count: number;
    completion_percentage: number;
  };

  // Context
  context?: {
    persona: string | null;
    persona_label: string | null;
    entity_type: string | null;
    business_model: string | null;
    url: string;
  };

  // Channels
  channels?: ChannelStatus[];

  // References
  profileId?: string;
  brandKitId?: string;
  socialProfileIds?: string[];

  // Progress
  progress?: EnhancedJobProgress;

  // Timestamps
  created_at: string;
  completed_at?: string;
  last_updated: string;

  // Error
  error?: string | null;
}
