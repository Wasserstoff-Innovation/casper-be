import mongoose, { Schema, Document } from 'mongoose';

export type CampaignStatus = 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export interface ICampaignGoal {
  id?: string;
  title?: string;
  description?: string;
  priority?: number;
}

export interface ICampaignNew extends Document {
  brand_id: string;
  name?: string;
  status: CampaignStatus;
  recommendation_ids?: string[];
  goals?: ICampaignGoal[];
  start_date?: string;
  end_date?: string;
  duration_weeks?: number;
  posts_per_week?: number;
  total_posts?: number;
  calendar_job_id?: string;
  calendar_status?: string;
  created_at?: Date;
  updated_at?: Date;
}

const CampaignNewSchema = new Schema<ICampaignNew>(
  {
    brand_id: { type: String, required: true, index: true },
    name: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'],
      default: 'DRAFT'
    },
    recommendation_ids: [{ type: String }],
    goals: [{
      id: String,
      title: String,
      description: String,
      priority: Number
    }],
    start_date: { type: String },
    end_date: { type: String },
    duration_weeks: { type: Number },
    posts_per_week: { type: Number, default: 4 },
    total_posts: { type: Number },
    calendar_job_id: { type: String },
    calendar_status: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  {
    collection: 'campaigns',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

CampaignNewSchema.index({ brand_id: 1, status: 1 });

export const CampaignNew = mongoose.model<ICampaignNew>('CampaignNew', CampaignNewSchema);
