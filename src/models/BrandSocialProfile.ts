import { Schema, model, Document, Types } from 'mongoose';

// Individual social profile within the profiles array
export interface ISocialProfileItem {
  platform: string;
  handle?: string | null;
  url?: string | null;
  status: string; // found, not_found, manual, reanalysis
  followers_count?: number;
}

export interface IBrandSocialProfile extends Document {
  brandProfileId?: string; // Python stores as string
  brandKitId?: string;
  userId?: string;
  profiles?: ISocialProfileItem[];
  platforms_found?: string[];
  total_found?: number;
  total_platforms?: number;
  created_at?: Date;
}

const BrandSocialProfileSchema = new Schema<IBrandSocialProfile>({
  brandProfileId: { type: String },
  brandKitId: { type: String },
  userId: { type: String },
  profiles: [{
    platform: { type: String },
    handle: { type: String },
    url: { type: String },
    status: { type: String },
    followers_count: { type: Number }
  }],
  platforms_found: [{ type: String }],
  total_found: { type: Number },
  total_platforms: { type: Number },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'brand_social_profiles'
});

// Indexes
BrandSocialProfileSchema.index({ profileId: 1 });
BrandSocialProfileSchema.index({ brandProfileId: 1 });
BrandSocialProfileSchema.index({ platform: 1 });
BrandSocialProfileSchema.index({ profileId: 1, platform: 1 });
BrandSocialProfileSchema.index({ brandProfileId: 1, platform: 1 });

export const BrandSocialProfile = model<IBrandSocialProfile>('BrandSocialProfile', BrandSocialProfileSchema);
