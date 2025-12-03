import { Schema, model, Document, Types } from 'mongoose';
import type {
  ComprehensiveBrandKit,
  DataQualityMetrics,
  SlideConfig
} from '../types/brand.types';

/**
 * BRAND KIT MODEL
 *
 * Mongoose schema for brand_kits collection.
 * All type definitions are in src/types/brand.types.ts (single source of truth).
 */

export interface IBrandKit extends Document {
  userId?: Types.ObjectId | string;
  profileId?: string;
  brandProfileId?: Types.ObjectId | string;
  jobId?: string;
  brand_name?: string;
  domain?: string;

  // Main data - single source of truth
  comprehensive?: ComprehensiveBrandKit;

  // Data quality metrics
  data_quality?: DataQualityMetrics;

  // Visual kit UI config
  visual_kit_config?: {
    slides?: SlideConfig[];
    settings?: {
      aspectRatio?: '16:9' | '4:3' | '1:1' | 'A4';
      exportFormat?: 'pdf' | 'png' | 'pptx';
      includePageNumbers?: boolean;
      watermark?: string;
    };
    lastEditedAt?: Date;
  };

  // ==========================================
  // DEPRECATED FIELDS (for backward compatibility)
  // These are kept for service migration period
  // DO NOT USE - will be removed in next version
  // ==========================================
  /** @deprecated Use 'comprehensive' instead */
  kitData?: any;
  // ==========================================
  // END DEPRECATED FIELDS
  // ==========================================

  // Legacy flat structure (deprecated)
  visual_identity?: any;
  verbal_identity?: any;
  proof_trust?: any;
  seo?: any;
  content?: any;
  conversion?: any;
  product?: any;

  generated_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const BrandKitSchema = new Schema<IBrandKit>({
  userId: { type: Schema.Types.Mixed },
  profileId: { type: String, unique: true, sparse: true },
  brandProfileId: { type: Schema.Types.Mixed },
  jobId: { type: String },
  brand_name: { type: String },
  domain: { type: String },

  comprehensive: { type: Schema.Types.Mixed },
  data_quality: { type: Schema.Types.Mixed },
  visual_kit_config: { type: Schema.Types.Mixed },

  // Legacy
  visual_identity: { type: Schema.Types.Mixed },
  verbal_identity: { type: Schema.Types.Mixed },
  proof_trust: { type: Schema.Types.Mixed },
  seo: { type: Schema.Types.Mixed },
  content: { type: Schema.Types.Mixed },
  conversion: { type: Schema.Types.Mixed },
  product: { type: Schema.Types.Mixed },
  generated_at: { type: Date },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'brand_kits'
});

BrandKitSchema.index({ userId: 1 });
BrandKitSchema.index({ profileId: 1 });
BrandKitSchema.index({ brandProfileId: 1 });
BrandKitSchema.index({ domain: 1 });

BrandKitSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const BrandKit = model<IBrandKit>('BrandKit', BrandKitSchema);
