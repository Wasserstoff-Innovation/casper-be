import { Schema, model, Document, Types } from 'mongoose';

export interface IBrandKit extends Document {
  userId?: Types.ObjectId;
  profileId?: string; // Python stores as string
  brandProfileId?: Types.ObjectId;
  jobId?: string;
  brand_name?: string;
  domain?: string;

  // Python v2 flat structure
  visual_identity?: {
    colors?: {
      primary?: string[];
      secondary?: string[];
      neutrals?: string[];
    };
    typography?: {
      heading?: string;
      body?: string;
      mono?: string | null;
    };
    logo_url?: string | null;
    favicon_url?: string | null;
    style_tags?: string[];
    consistency_score?: number;
  };
  verbal_identity?: {
    tagline?: string | null;
    elevator_pitch?: string;
    value_proposition?: string;
    brand_story?: string | null;
    tone_voice?: string[];
    personality_traits?: string[];
  };
  proof_trust?: {
    testimonials_count?: number;
    case_studies_count?: number;
    client_logos_count?: number;
    reviews_count?: number;
    awards_count?: number;
  };
  seo?: {
    primary_keywords?: string[];
    secondary_keywords?: string[];
    technical_score?: number;
  };
  content?: {
    has_blog?: boolean;
    blog_url?: string | null;
    post_count?: number;
  };
  conversion?: {
    primary_cta_text?: string;
    has_pricing_page?: boolean;
    free_trial?: boolean;
  };
  product?: {
    products_count?: number;
    plans_count?: number;
    key_features_count?: number;
  };
  generated_at?: Date;

  // Legacy field
  kitData?: any;

  created_at: Date;
  updated_at: Date;
}

const BrandKitSchema = new Schema<IBrandKit>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  profileId: { type: String, unique: true }, // Python stores as string - this is the primary lookup
  brandProfileId: { type: Schema.Types.ObjectId, ref: 'BrandProfile' }, // Legacy - removed unique constraint
  jobId: { type: String },
  brand_name: { type: String },
  domain: { type: String },

  // Python v2 flat structure
  visual_identity: { type: Schema.Types.Mixed },
  verbal_identity: { type: Schema.Types.Mixed },
  proof_trust: { type: Schema.Types.Mixed },
  seo: { type: Schema.Types.Mixed },
  content: { type: Schema.Types.Mixed },
  conversion: { type: Schema.Types.Mixed },
  product: { type: Schema.Types.Mixed },
  generated_at: { type: Date },

  // Legacy field
  kitData: { type: Schema.Types.Mixed },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'brand_kits'
});

// Indexes
BrandKitSchema.index({ userId: 1 });
BrandKitSchema.index({ profileId: 1 });
// Note: brandProfileId unique index is already created by 'unique: true' in schema definition

// Update updated_at on save
BrandKitSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const BrandKit = model<IBrandKit>('BrandKit', BrandKitSchema);
