import { Schema, model, Document } from 'mongoose';

/**
 * BRAND PROFILE MODEL
 *
 * Mongoose schema for brand_profiles collection.
 * Stores ONLY summary data for list views and quick access.
 *
 * IMPORTANT: Detailed brand data is in brand_kits collection.
 * Do NOT duplicate fields from BrandKit here.
 */

export interface IBrandProfile extends Document {
  userId: string;
  jobId?: string;

  // Essential info for list views
  name: string | null;
  domain: string;
  url?: string;
  type?: string;
  business_model?: string;
  persona?: string;

  // Denormalized for list display ONLY (source is brand_kits)
  logo_url?: string;

  // ==========================================
  // DEPRECATED FIELDS (for backward compatibility)
  // These are kept for service migration period
  // DO NOT USE - will be removed in next version
  // ==========================================
  /** @deprecated Use 'name' instead */
  brand_name?: string | null;
  /** @deprecated Use brandKitId reference instead */
  brandKit?: any;
  /** @deprecated Use 'scores' instead */
  brandScores?: any;
  /** @deprecated Use 'roadmap' instead */
  brandRoadmap?: any;
  /** @deprecated No longer stored on profile */
  analysis_context?: any;
  /** @deprecated No longer stored on profile */
  profileId?: string;
  /** @deprecated No longer stored on profile */
  status?: string;
  /** @deprecated No longer stored on profile */
  data?: any;
  /** @deprecated No longer stored on profile */
  jobError?: string;
  /** @deprecated Use brandKit.comprehensive.visual_identity.logos.favicon_url */
  favicon_url?: string;
  /** @deprecated Use brandKit.comprehensive.visual_identity.color_system.primary_colors */
  primary_colors?: string[];
  /** @deprecated Use brandKit.comprehensive.visual_identity.typography.heading_font */
  heading_font?: string;
  /** @deprecated Use brandKit.comprehensive.visual_identity.typography.body_font */
  body_font?: string;
  /** @deprecated Use brandKit.comprehensive.verbal_identity.elevator_pitch */
  elevator_pitch_one_liner?: string;
  /** @deprecated Use brandKit.comprehensive.verbal_identity.value_proposition */
  value_proposition?: string;
  /** @deprecated Use brandKit.comprehensive.verbal_identity.brand_story */
  brand_story?: string;
  /** @deprecated Use brandKit.comprehensive.verbal_identity.tone_of_voice */
  tone_voice?: string[];
  /** @deprecated No longer stored on profile */
  the_problem_it_solves?: string;
  /** @deprecated No longer stored on profile */
  the_transformation_outcome?: string;
  /** @deprecated No longer stored on profile */
  canonical_domain?: string;
  /** @deprecated Use job tracking collection */
  jobStartedAt?: Date;
  /** @deprecated Use job tracking collection */
  jobCompletedAt?: Date;
  /** @deprecated Use 'persona' instead */
  persona_id?: string;
  // ==========================================
  // END DEPRECATED FIELDS
  // ==========================================

  // Scores
  scores?: {
    overall: number | null;
    visual_clarity: number | null;
    verbal_clarity: number | null;
    positioning: number | null;
    presence: number | null;
    conversion_trust: number | null;
  };

  // Roadmap embedded for quick access
  roadmap?: {
    tasks: Array<{
      task_id: string;
      title: string;
      description: string;
      category: string;
      effort: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
      priority_score: number;
      status: 'pending' | 'in_progress' | 'completed';
      type: 'quick_win' | 'project' | 'long_term';
    }>;
    quick_wins_count: number;
    projects_count: number;
    long_term_count: number;
    total_count: number;
  };

  // Target audience summary
  target_customer_profile?: {
    role: string | null;
    company_size: string | null;
    industry: string | null;
    pains: string[];
  };

  // Quick flags for filtering/sorting
  overall_score?: number;
  completeness_score?: number;
  total_critical_gaps?: number;
  has_social_profiles?: number;
  has_blog?: number;
  has_review_sites?: number;

  // References to other collections
  brandKitId?: string;
  socialProfileId?: string;
  jobDocId?: string;

  // Job progress (for running jobs)
  currentPhase?: string;
  currentPhaseLabel?: string;
  phaseStatus?: string;
  phaseDetails?: string;
  progressPercentage?: number;
  lastProgressUpdate?: Date;

  created_at: Date;
  updated_at: Date;
}

const BrandProfileSchema = new Schema<IBrandProfile>({
  userId: { type: String, required: true, index: true },
  jobId: { type: String, index: true },

  name: { type: String },
  domain: { type: String, required: true, index: true },
  url: { type: String },
  type: { type: String },
  business_model: { type: String },
  persona: { type: String, index: true },

  logo_url: { type: String },

  scores: {
    overall: { type: Number },
    visual_clarity: { type: Number },
    verbal_clarity: { type: Number },
    positioning: { type: Number },
    presence: { type: Number },
    conversion_trust: { type: Number }
  },

  roadmap: {
    tasks: [{
      task_id: String,
      title: String,
      description: String,
      category: String,
      effort: { type: String, enum: ['low', 'medium', 'high'] },
      impact: { type: String, enum: ['low', 'medium', 'high'] },
      priority_score: Number,
      status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
      type: { type: String, enum: ['quick_win', 'project', 'long_term'] }
    }],
    quick_wins_count: Number,
    projects_count: Number,
    long_term_count: Number,
    total_count: Number
  },

  target_customer_profile: {
    role: String,
    company_size: String,
    industry: String,
    pains: [String]
  },

  overall_score: { type: Number, index: true },
  completeness_score: { type: Number },
  total_critical_gaps: { type: Number },
  has_social_profiles: { type: Number, default: 0 },
  has_blog: { type: Number, default: 0 },
  has_review_sites: { type: Number, default: 0 },

  brandKitId: { type: String },
  socialProfileId: { type: String },
  jobDocId: { type: String },

  currentPhase: String,
  currentPhaseLabel: String,
  phaseStatus: String,
  phaseDetails: String,
  progressPercentage: { type: Number, min: 0, max: 100 },
  lastProgressUpdate: Date,

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'brand_profiles'
});

BrandProfileSchema.index({ userId: 1, created_at: -1 });
BrandProfileSchema.index({ userId: 1, overall_score: -1 });

BrandProfileSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const BrandProfile = model<IBrandProfile>('BrandProfile', BrandProfileSchema);
