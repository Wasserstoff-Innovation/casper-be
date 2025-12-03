import { Schema, model, Document, Types } from 'mongoose';

/**
 * BRAND SOCIAL PROFILE MODEL
 *
 * Stores social media profiles for a brand.
 * This is a separate collection to allow efficient querying and updates
 * of social profiles without loading the entire brand kit.
 */

// ============================================================================
// Types
// ============================================================================

export type SocialProfileStatus = 'found' | 'not_found' | 'manual' | 'reanalysis' | 'verified';

export interface ISocialProfileItem {
  platform: string;            // 'LinkedIn', 'Twitter', 'Instagram', etc.
  handle?: string | null;      // @handle or username
  url?: string | null;         // Full profile URL
  status: SocialProfileStatus;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  verified?: boolean;          // Platform verification badge
  bio?: string | null;
  profile_image_url?: string | null;
  last_post_date?: Date | null;
  engagement_rate?: number;    // 0-100
  confidence?: number;         // 0.0-1.0
  discovered_at?: Date;
  last_checked?: Date;
}

// ============================================================================
// Main Interface
// ============================================================================

export interface IBrandSocialProfile extends Document {
  // ========== IDENTIFIERS ==========
  brandProfileId: string;      // Reference to brand_profiles
  brandKitId?: string;         // Reference to brand_kits
  userId: string;              // User who owns this

  // ========== PROFILES ==========
  profiles: ISocialProfileItem[];

  // ========== SUMMARY STATS ==========
  platforms_found: string[];   // List of platforms where profiles were found
  total_found: number;         // Count of profiles found
  total_platforms: number;     // Total platforms checked (usually 5-7)
  total_followers?: number;    // Sum of all followers across platforms

  // ========== ENGAGEMENT METRICS (aggregated) ==========
  average_engagement_rate?: number;
  most_active_platform?: string;
  last_activity_date?: Date;

  // ========== QUALITY METRICS ==========
  completeness?: number;       // 0-100: how many expected fields are filled
  confidence?: number;         // 0.0-1.0: average confidence of found profiles

  // ========== TIMESTAMPS ==========
  created_at: Date;
  updated_at: Date;
  last_analyzed_at?: Date;
}

// ============================================================================
// Schema
// ============================================================================

const SocialProfileItemSchema = new Schema({
  platform: { type: String, required: true },
  handle: { type: String },
  url: { type: String },
  status: {
    type: String,
    enum: ['found', 'not_found', 'manual', 'reanalysis', 'verified'],
    default: 'not_found'
  },
  followers_count: { type: Number, default: 0 },
  following_count: { type: Number },
  posts_count: { type: Number },
  verified: { type: Boolean, default: false },
  bio: { type: String },
  profile_image_url: { type: String },
  last_post_date: { type: Date },
  engagement_rate: { type: Number },
  confidence: { type: Number, min: 0, max: 1 },
  discovered_at: { type: Date },
  last_checked: { type: Date }
}, { _id: false });

const BrandSocialProfileSchema = new Schema<IBrandSocialProfile>({
  // Identifiers
  brandProfileId: { type: String, required: true, index: true },
  brandKitId: { type: String, index: true },
  userId: { type: String, required: true, index: true },

  // Profiles array
  profiles: [SocialProfileItemSchema],

  // Summary stats
  platforms_found: [{ type: String }],
  total_found: { type: Number, default: 0 },
  total_platforms: { type: Number, default: 5 },
  total_followers: { type: Number },

  // Engagement metrics
  average_engagement_rate: { type: Number },
  most_active_platform: { type: String },
  last_activity_date: { type: Date },

  // Quality metrics
  completeness: { type: Number, min: 0, max: 100 },
  confidence: { type: Number, min: 0, max: 1 },

  // Timestamps
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  last_analyzed_at: { type: Date }
}, {
  timestamps: false,
  collection: 'brand_social_profiles'
});

// ============================================================================
// Indexes
// ============================================================================

BrandSocialProfileSchema.index({ brandProfileId: 1 });
BrandSocialProfileSchema.index({ userId: 1, created_at: -1 });
BrandSocialProfileSchema.index({ 'profiles.platform': 1 });
BrandSocialProfileSchema.index({ 'profiles.status': 1 });
BrandSocialProfileSchema.index({ total_followers: -1 });

// Compound indexes
BrandSocialProfileSchema.index({ brandProfileId: 1, 'profiles.platform': 1 });
BrandSocialProfileSchema.index({ userId: 1, total_found: -1 });

// Update updated_at on save
BrandSocialProfileSchema.pre('save', function(next) {
  this.updated_at = new Date();

  // Auto-calculate summary stats
  if (this.profiles && this.profiles.length > 0) {
    const foundProfiles = this.profiles.filter(p => p.status === 'found' || p.status === 'verified' || p.status === 'manual');
    this.platforms_found = foundProfiles.map(p => p.platform);
    this.total_found = foundProfiles.length;
    this.total_platforms = this.profiles.length;

    // Calculate total followers
    this.total_followers = foundProfiles.reduce((sum, p) => sum + (p.followers_count || 0), 0);

    // Calculate average engagement rate
    const profilesWithEngagement = foundProfiles.filter(p => p.engagement_rate !== undefined);
    if (profilesWithEngagement.length > 0) {
      this.average_engagement_rate = profilesWithEngagement.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / profilesWithEngagement.length;
    }

    // Calculate average confidence
    const profilesWithConfidence = foundProfiles.filter(p => p.confidence !== undefined);
    if (profilesWithConfidence.length > 0) {
      this.confidence = profilesWithConfidence.reduce((sum, p) => sum + (p.confidence || 0), 0) / profilesWithConfidence.length;
    }

    // Find most active platform (by last_post_date)
    const sortedByActivity = foundProfiles
      .filter(p => p.last_post_date)
      .sort((a, b) => (b.last_post_date?.getTime() || 0) - (a.last_post_date?.getTime() || 0));
    if (sortedByActivity.length > 0) {
      this.most_active_platform = sortedByActivity[0].platform;
      this.last_activity_date = sortedByActivity[0].last_post_date || undefined;
    }
  }

  next();
});

export const BrandSocialProfile = model<IBrandSocialProfile>('BrandSocialProfile', BrandSocialProfileSchema);
