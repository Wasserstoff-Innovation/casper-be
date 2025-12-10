import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IContentConcept {
  title?: string;
  description?: string;
  hook?: string;
  call_to_action?: string;
  key_points?: string[];
}

export interface ICreativeDirection {
  format?: string;
  visual_concept?: string;
  hashtags?: string[];
  tone?: string;
}

export interface IPrerequisites {
  assets_needed?: string[];
  research_needed?: string[];
  approvals_needed?: string[];
  dependencies?: string[];
  estimated_prep_time?: string;
}

export interface IProductionRequirements {
  effort_level?: string;
  resources_needed?: string[];
  tools_needed?: string[];
}

export interface IStrategicContext {
  goal_alignment?: string;
  audience_segment?: string;
  key_message?: string;
}

export interface ICalendarPost extends Document {
  brand_id: string;
  campaign_id: string;
  date: string;
  day_of_week?: string;
  week_number?: number;
  post_order?: number;
  platform: string;
  content_pillar?: string;
  funnel_stage?: string;
  content_concept?: IContentConcept;
  creative_direction?: ICreativeDirection;
  strategic_context?: IStrategicContext;
  prerequisites?: IPrerequisites;
  production_requirements?: IProductionRequirements;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

const CalendarPostSchema = new Schema<ICalendarPost>(
  {
    brand_id: { type: String, required: true, index: true },
    campaign_id: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    day_of_week: { type: String },
    week_number: { type: Number },
    post_order: { type: Number },
    platform: { type: String, required: true },
    content_pillar: { type: String },
    funnel_stage: { type: String },
    content_concept: {
      title: String,
      description: String,
      hook: String,
      call_to_action: String,
      key_points: [String]
    },
    creative_direction: {
      format: String,
      visual_concept: String,
      hashtags: [String],
      tone: String
    },
    strategic_context: {
      goal_alignment: String,
      audience_segment: String,
      key_message: String
    },
    prerequisites: {
      assets_needed: [String],
      research_needed: [String],
      approvals_needed: [String],
      dependencies: [String],
      estimated_prep_time: String
    },
    production_requirements: {
      effort_level: String,
      resources_needed: [String],
      tools_needed: [String]
    },
    status: { type: String, default: 'scheduled' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  {
    collection: 'calendar_posts',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Compound indexes for efficient queries
CalendarPostSchema.index({ brand_id: 1, campaign_id: 1 });
CalendarPostSchema.index({ campaign_id: 1, date: 1, post_order: 1 });
CalendarPostSchema.index({ brand_id: 1, date: 1 });

export const CalendarPost = mongoose.model<ICalendarPost>('CalendarPost', CalendarPostSchema);
