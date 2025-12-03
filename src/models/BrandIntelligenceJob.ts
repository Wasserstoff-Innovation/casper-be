import { Schema, model, Document } from 'mongoose';
import type {
  DBStrengthRisk,
  DBCriticalGap,
  DBSnapshot,
  DBDataQuality,
  DBChannel,
  DBProgress
} from '../types/brand.types';

/**
 * BRAND INTELLIGENCE JOB MODEL
 *
 * Stores job tracking + computed summary fields for fast frontend access.
 * This is the primary collection for:
 * - Job status tracking (queued, running, complete, failed)
 * - Computed snapshot data (strengths, risks, field counts)
 * - Critical gaps summary
 * - Data quality metrics
 * - Quick access to scores and roadmap summary
 *
 * Related collections:
 * - brand_profiles: Basic brand info + scores + roadmap tasks
 * - brand_kits: Detailed brand kit sections
 * - brand_social_profiles: Social media profiles
 *
 * IMPORTANT: All types are imported from types/brand.types.ts (single source of truth)
 */

// ============================================================================
// Types (re-exported from brand.types.ts for convenience)
// ============================================================================

export type JobStatus = 'queued' | 'running' | 'complete' | 'failed';
export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// Re-export types from brand.types.ts for backwards compatibility
export type IStrengthRisk = DBStrengthRisk;
export type ICriticalGap = DBCriticalGap;
export type ISnapshot = DBSnapshot;
export type IDataQuality = DBDataQuality;
export type IChannel = DBChannel;
export type IProgress = DBProgress;

// Types that are specific to this model (not duplicated elsewhere)
export interface IScores {
  overall: number | null;
  visual_clarity: number | null;
  verbal_clarity: number | null;
  positioning: number | null;
  presence: number | null;
  conversion_trust: number | null;
}

export interface IBrandInfo {
  name: string | null;
  domain: string;
  url: string | null;
  logo_url: string | null;
  favicon_url: string | null;
}

export interface IRoadmapSummary {
  quick_wins_count: number;
  projects_count: number;
  long_term_count: number;
  total_count: number;
  completed_count: number;
  completion_percentage: number;
}

export interface IContext {
  persona: string | null;
  persona_label: string | null;
  entity_type: string | null;
  business_model: string | null;
  channel_orientation: string | null;
  url: string;
}

export interface IResult {
  profile_id: string;
  brand_kit_id?: string;
  social_profile_ids?: string[];
  tasks_count?: number;
  scores?: IScores;
  context?: IContext;
}

// ============================================================================
// Main Interface
// ============================================================================

export interface IBrandIntelligenceJob extends Document {
  // Job identification
  url: string;
  userId: string;
  status: JobStatus;
  pipeline: string;            // e.g., 'wisdom_tree'

  // ========== COMPUTED FIELDS (populated on completion) ==========
  snapshot?: DBSnapshot;
  criticalGaps?: DBCriticalGap[];
  dataQuality?: DBDataQuality;
  scores?: IScores;
  brand?: IBrandInfo;
  roadmap?: IRoadmapSummary;
  context?: IContext;
  channels?: DBChannel[];

  // ========== IDs FOR LINKING ==========
  profileId?: string;          // Reference to brand_profiles
  brandKitId?: string;         // Reference to brand_kits
  socialProfileIds?: string[]; // References to brand_social_profiles

  // ========== PROGRESS TRACKING ==========
  progress?: DBProgress;

  // ========== LEGACY RESULT OBJECT ==========
  result?: IResult;

  // ========== ERROR HANDLING ==========
  error?: string | null;
  errorDetails?: any;

  // ========== TIMESTAMPS ==========
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  last_updated: Date;
}

// ============================================================================
// Schema
// ============================================================================

const BrandIntelligenceJobSchema = new Schema<IBrandIntelligenceJob>({
  // Job identification
  url: { type: String, required: true },
  userId: { type: String, required: true },
  status: {
    type: String,
    enum: ['queued', 'running', 'complete', 'failed'],
    default: 'queued'
  },
  pipeline: { type: String, default: 'wisdom_tree' },

  // Computed fields
  snapshot: {
    strengths: [{
      dimension: String,
      label: String,
      score: Number,
      description: String
    }],
    risks: [{
      dimension: String,
      label: String,
      score: Number,
      description: String
    }],
    fieldsFound: Number,
    fieldsInferred: Number,
    fieldsMissing: Number,
    fieldsManual: Number,
    totalFields: Number,
    overallCompleteness: Number,
    sectionCompleteness: { type: Schema.Types.Mixed },
    sectionDetails: [{
      section: String,
      label: String,
      completeness: Number,
      totalFields: Number,
      foundFields: Number,
      inferredFields: Number,
      missingFields: Number,
      manualFields: Number
    }],
    evidenceSummary: {
      sitePages: Number,
      screenshots: Number,
      searchResults: Number
    }
  },

  criticalGaps: [{
    field: String,
    fieldLabel: String,
    section: String,
    sectionLabel: String,
    impact: { type: String, enum: ['critical', 'high', 'medium', 'low'] },
    recommendation: String,
    relatedTaskId: String
  }],

  dataQuality: {
    completeness: Number,
    accuracy: Number,
    freshness: Number,
    overallQuality: Number,
    averageConfidence: Number,
    sourceBreakdown: { type: Schema.Types.Mixed },
    lowConfidenceFields: [{
      field: String,
      confidence: Number
    }]
  },

  scores: {
    overall: Number,
    visual_clarity: Number,
    verbal_clarity: Number,
    positioning: Number,
    presence: Number,
    conversion_trust: Number
  },

  brand: {
    name: String,
    domain: String,
    url: String,
    logo_url: String,
    favicon_url: String
  },

  roadmap: {
    quick_wins_count: Number,
    projects_count: Number,
    long_term_count: Number,
    total_count: Number,
    completed_count: Number,
    completion_percentage: Number
  },

  context: {
    persona: String,
    persona_label: String,
    entity_type: String,
    business_model: String,
    channel_orientation: String,
    url: String
  },

  channels: [{
    id: String,
    label: String,
    present: Boolean,
    details: String,
    urls: [String]
  }],

  // IDs for linking
  profileId: { type: String },
  brandKitId: { type: String },
  socialProfileIds: [{ type: String }],

  // Progress tracking
  progress: {
    progress_percentage: Number,
    current_phase: String,
    current_phase_label: String,
    phase_status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'] },
    phase_details: String,
    current_step: Number,
    total_steps: Number,
    step_label: String,
    current_task: String,
    sub_progress: {
      current: Number,
      total: Number,
      current_name: String,
      current_label: String,
      modules_completed: [String],
      modules_pending: [String]
    },
    phase_started_at: Date,
    last_updated: Date
  },

  // Legacy result object
  result: {
    profile_id: String,
    brand_kit_id: String,
    social_profile_ids: [String],
    tasks_count: Number,
    scores: { type: Schema.Types.Mixed },
    context: { type: Schema.Types.Mixed }
  },

  // Error handling
  error: String,
  errorDetails: { type: Schema.Types.Mixed },

  // Timestamps
  created_at: { type: Date, default: Date.now },
  started_at: Date,
  completed_at: Date,
  last_updated: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'brand_intelligence_jobs'
});

// ============================================================================
// Indexes
// ============================================================================

BrandIntelligenceJobSchema.index({ userId: 1, created_at: -1 });
BrandIntelligenceJobSchema.index({ userId: 1, status: 1 });
BrandIntelligenceJobSchema.index({ status: 1 });
BrandIntelligenceJobSchema.index({ profileId: 1 });
BrandIntelligenceJobSchema.index({ brandKitId: 1 });
BrandIntelligenceJobSchema.index({ url: 1 });
BrandIntelligenceJobSchema.index({ 'brand.domain': 1 });
BrandIntelligenceJobSchema.index({ 'scores.overall': 1 });
BrandIntelligenceJobSchema.index({ 'context.persona': 1 });

// Compound indexes for common queries
BrandIntelligenceJobSchema.index({ userId: 1, status: 1, 'scores.overall': -1 });
BrandIntelligenceJobSchema.index({ userId: 1, 'context.persona': 1, status: 1 });

// Update last_updated on save
BrandIntelligenceJobSchema.pre('save', function(next) {
  this.last_updated = new Date();
  next();
});

export const BrandIntelligenceJob = model<IBrandIntelligenceJob>('BrandIntelligenceJob', BrandIntelligenceJobSchema);
