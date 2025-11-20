import { Schema, model, Document, Types } from 'mongoose';

export interface IBrandProfile extends Document {
  userId?: string; // Changed to string to match Python backend (stores as string, not ObjectId)
  jobId?: string;
  profileId?: string;

  // Python v2 fields (flat structure)
  name?: string;
  domain?: string;
  url?: string;
  type?: string;
  business_model?: string;
  persona?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_colors?: string[];
  heading_font?: string;
  body_font?: string;
  elevator_pitch_one_liner?: string;
  value_proposition?: string;
  brand_story?: string;
  tone_voice?: string[];
  target_customer_profile?: any;
  the_problem_it_solves?: string[];
  the_transformation_outcome?: string[];
  scores?: {
    overall?: number;
    visual_clarity?: number;
    verbal_clarity?: number;
    positioning?: number;
    presence?: number;
    conversion_trust?: number;
  };
  roadmap?: {
    tasks?: any[];
    quick_wins_count?: number;
    projects_count?: number;
    long_term_count?: number;
    total_count?: number;
  };

  // Legacy fields (may be deprecated)
  data?: any;
  brandKit?: any;
  brandScores?: any;
  brandRoadmap?: any;
  analysis_context?: any;
  status?: string;
  jobStartedAt?: Date;
  jobCompletedAt?: Date;
  jobError?: string;

  // Progress tracking fields (from Python backend)
  currentPhase?: string; // current_phase: e.g., "evidence_collection"
  currentPhaseLabel?: string; // current_phase_label: e.g., "Collecting evidence"
  phaseStatus?: string; // phase_status: "in_progress", "completed", "failed"
  phaseDetails?: string; // phase_details: e.g., "Collected 5 pages, 3 screenshots"
  progressPercentage?: number; // progress_percentage: 0-100
  lastProgressUpdate?: Date; // last_updated timestamp

  // Summary columns for fast queries (legacy - duplicates removed)
  canonical_domain?: string;
  brand_name?: string;
  persona_id?: string;
  entity_type?: string;
  channel_orientation?: string;
  overall_score?: number;
  completeness_score?: number;
  total_critical_gaps?: number;
  has_social_profiles?: number;
  has_blog?: number;
  has_review_sites?: number;

  created_at: Date;
  updated_at: Date;
}

const BrandProfileSchema = new Schema<IBrandProfile>({
  userId: { type: String }, // Changed to String to match Python backend
  jobId: { type: String },
  profileId: { type: String },

  // Python v2 fields (flat structure)
  name: { type: String },
  domain: { type: String },
  url: { type: String },
  type: { type: String },
  business_model: { type: String },
  persona: { type: String },
  logo_url: { type: String },
  favicon_url: { type: String },
  primary_colors: [{ type: String }],
  heading_font: { type: String },
  body_font: { type: String },
  elevator_pitch_one_liner: { type: String },
  value_proposition: { type: String },
  brand_story: { type: String },
  tone_voice: [{ type: String }],
  target_customer_profile: { type: Schema.Types.Mixed },
  the_problem_it_solves: [{ type: String }],
  the_transformation_outcome: [{ type: String }],
  scores: {
    overall: { type: Number },
    visual_clarity: { type: Number },
    verbal_clarity: { type: Number },
    positioning: { type: Number },
    presence: { type: Number },
    conversion_trust: { type: Number }
  },
  roadmap: { type: Schema.Types.Mixed },

  // Legacy fields (may be deprecated)
  data: { type: Schema.Types.Mixed },
  brandKit: { type: Schema.Types.Mixed },
  brandScores: { type: Schema.Types.Mixed },
  brandRoadmap: { type: Schema.Types.Mixed },
  analysis_context: { type: Schema.Types.Mixed },
  status: { type: String, maxlength: 50 },
  jobStartedAt: { type: Date },
  jobCompletedAt: { type: Date },
  jobError: { type: String },

  // Progress tracking fields
  currentPhase: { type: String },
  currentPhaseLabel: { type: String },
  phaseStatus: { type: String },
  phaseDetails: { type: String },
  progressPercentage: { type: Number, min: 0, max: 100 },
  lastProgressUpdate: { type: Date },

  // Summary columns (legacy - duplicates removed)
  canonical_domain: { type: String },
  brand_name: { type: String },
  persona_id: { type: String },
  entity_type: { type: String },
  channel_orientation: { type: String },
  overall_score: { type: Number },
  completeness_score: { type: Number },
  total_critical_gaps: { type: Number },
  has_social_profiles: { type: Number, default: 0 },
  has_blog: { type: Number, default: 0 },
  has_review_sites: { type: Number, default: 0 },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'brand_profiles'
});

// Indexes for fast queries
BrandProfileSchema.index({ userId: 1, created_at: -1 });
BrandProfileSchema.index({ profileId: 1 });
BrandProfileSchema.index({ jobId: 1 });
BrandProfileSchema.index({ status: 1 });
BrandProfileSchema.index({ domain: 1 });
BrandProfileSchema.index({ canonical_domain: 1 });
BrandProfileSchema.index({ overall_score: 1 });
BrandProfileSchema.index({ persona_id: 1 });
BrandProfileSchema.index({ entity_type: 1 });

// Compound indexes for common queries
BrandProfileSchema.index({ persona_id: 1, entity_type: 1, status: 1 });
BrandProfileSchema.index({ userId: 1, status: 1, overall_score: -1 });

// Indexes for nested FieldValue paths (critical paths only)
BrandProfileSchema.index({ 'brandKit.external_presence.visual_identity_v3.logos.primary_logo_url.status': 1 });
BrandProfileSchema.index({ 'brandKit.external_presence.social_profiles.platforms_found': 1 });
BrandProfileSchema.index({ 'brandKit.proof_trust.reviews.remarks.platform_discrepancy.gap': 1 });

// Text index for full-text search across brand kit
BrandProfileSchema.index({
  brand_name: 'text',
  canonical_domain: 'text',
  'brandKit.brand_basics.tagline.value': 'text',
  'brandKit.verbal_identity.mission_statement.value': 'text'
});

// Update updated_at on save
BrandProfileSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const BrandProfile = model<IBrandProfile>('BrandProfile', BrandProfileSchema);
