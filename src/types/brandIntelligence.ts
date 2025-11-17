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
  severity: 'critical' | 'important';
  recommendation: string;
  relatedCampaignId?: string; // Optional link to campaign that addresses this
}

// ============================================================================
// List Item (ultra-lightweight for list views)
// ============================================================================

export interface BrandProfileListItem {
  id: number;               // brand_profile.id
  domain: string;
  brandName: string | null;
  logo: string | null;      // primary logo URL
  personaId: string | null;
}

// ============================================================================
// Summary View (for drawer / list)
// ============================================================================

export interface BrandIntelligenceView {
  id: number;               // brand_profile.id
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
    totalCriticalGaps: number;
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

  // Data quality information
  dataQuality: {
    totalFields: number;
    foundFields: number;
    inferredFields: number;
    missingFields: number;
    averageConfidence: number;   // 0.0 - 1.0
    sourceBreakdown: Record<string, number>;  // {"homepage": 15, "about_page": 8, ...}
    lowConfidenceFields: Array<{ field: string; confidence: number }>;
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
    [dimensionId: string]: {
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
  estimatedTimeline: string;  // e.g., "2-3 weeks"
}

export interface RoadmapTaskSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: string;
  effort: string;
  status: string;
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
  notApplicableCount: number;
  criticalGaps: UICriticalGap[];
}

// ============================================================================
// Helper function to map dimension IDs to labels
// ============================================================================

export const DIMENSION_LABELS: Record<string, string> = {
  'visual_clarity': 'Visual Clarity',
  'verbal_clarity': 'Verbal Clarity',
  'positioning': 'Positioning',
  'presence': 'Presence',
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
