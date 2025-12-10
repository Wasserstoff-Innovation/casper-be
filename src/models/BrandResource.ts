import mongoose, { Schema, Document } from 'mongoose';

export type ResourceType = 'image' | 'video' | 'document' | 'link' | 'text';

export interface IBrandResource extends Document {
  brand_id: string;
  variable_name: string;
  resource_type: ResourceType;
  title?: string;
  description?: string;
  url?: string;
  content?: string;
  metadata?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

const BrandResourceSchema = new Schema<IBrandResource>(
  {
    brand_id: { type: String, required: true, index: true },
    variable_name: { type: String, required: true },
    resource_type: {
      type: String,
      enum: ['image', 'video', 'document', 'link', 'text'],
      required: true
    },
    title: { type: String },
    description: { type: String },
    url: { type: String },
    content: { type: String },
    metadata: { type: Schema.Types.Mixed },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  {
    collection: 'brand_resources',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Unique constraint on brand_id + variable_name
BrandResourceSchema.index({ brand_id: 1, variable_name: 1 }, { unique: true });

export const BrandResource = mongoose.model<IBrandResource>('BrandResource', BrandResourceSchema);
