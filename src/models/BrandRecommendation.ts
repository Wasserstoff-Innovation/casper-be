import mongoose, { Schema, Document } from 'mongoose';

export interface IRecommendationGoal {
  title?: string;
  description?: string;
  priority?: number;
  metrics?: string[];
}

export interface IPlatformStrategy {
  why?: string;
  audience?: string;
  post_types?: string[];
  themes?: string[];
  frequency?: string;
}

export interface IRecommendation {
  id?: string;
  goal?: IRecommendationGoal;
  primary_platform?: string;
  platform_strategy?: IPlatformStrategy;
  secondary_platforms?: string[];
  content_categories?: string[];
  target_audiences?: string[];
  depends_on?: string[];
  dependency_note?: string;
}

export interface IConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface IBrandRecommendation extends Document {
  brand_id: string;
  recommendations?: IRecommendation[];
  conversation_history?: IConversationMessage[];
  executive_summary?: string;
  today_date?: string;
  created_at?: Date;
  updated_at?: Date;
}

const BrandRecommendationSchema = new Schema<IBrandRecommendation>(
  {
    brand_id: { type: String, required: true, unique: true, index: true },
    recommendations: [{
      id: String,
      goal: {
        title: String,
        description: String,
        priority: Number,
        metrics: [String]
      },
      primary_platform: String,
      platform_strategy: {
        why: String,
        audience: String,
        post_types: [String],
        themes: [String],
        frequency: String
      },
      secondary_platforms: [String],
      content_categories: [String],
      target_audiences: [String],
      depends_on: [String],
      dependency_note: String
    }],
    conversation_history: [{
      role: { type: String, enum: ['user', 'assistant'] },
      content: String,
      timestamp: { type: Date, default: Date.now }
    }],
    executive_summary: { type: String },
    today_date: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  {
    collection: 'brand_recommendations',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

export const BrandRecommendation = mongoose.model<IBrandRecommendation>('BrandRecommendation', BrandRecommendationSchema);
