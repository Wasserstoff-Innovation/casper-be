import { Schema, model, Document, Types } from 'mongoose';

export interface IBrandSocialProfile extends Document {
  brandProfileId: Types.ObjectId;
  platform?: string; // twitter, linkedin, instagram, youtube, facebook, etc.
  handle?: string; // @example or username
  url?: string;
  followersCount?: number; // followers_count in DB
  status?: string; // found, inferred, missing
  source?: string; // where we found it
  profileType?: string; // organic, paid, community
  createdAt?: Date;
}

const BrandSocialProfileSchema = new Schema<IBrandSocialProfile>({
  brandProfileId: { type: Schema.Types.ObjectId, ref: 'BrandProfile', required: true },
  platform: { type: String },
  handle: { type: String },
  url: { type: String },
  followersCount: { type: Number, default: 0 },
  status: { type: String },
  source: { type: String },
  profileType: { type: String },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'brand_social_profiles'
});

// Indexes
BrandSocialProfileSchema.index({ brandProfileId: 1 });
BrandSocialProfileSchema.index({ platform: 1 });
BrandSocialProfileSchema.index({ brandProfileId: 1, platform: 1 });

export const BrandSocialProfile = model<IBrandSocialProfile>('BrandSocialProfile', BrandSocialProfileSchema);
