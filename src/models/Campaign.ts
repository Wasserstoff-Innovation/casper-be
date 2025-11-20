import { Schema, model, Document, Types } from 'mongoose';

// Campaign Plan
export interface ICampaignPlan extends Document {
  userId?: Types.ObjectId;
  brandProfileId?: Types.ObjectId;
  campaignId?: string;
  data?: any;
  created_at?: Date;
}

const CampaignPlanSchema = new Schema<ICampaignPlan>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  brandProfileId: { type: Schema.Types.ObjectId, ref: 'BrandProfile', unique: true },
  campaignId: { type: String },
  data: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'campaign_plans'
});

// Indexes
CampaignPlanSchema.index({ userId: 1 });
// Note: brandProfileId unique index is already created by 'unique: true' in schema definition
CampaignPlanSchema.index({ campaignId: 1 });

// Content Calendar
export interface IContentCalendar extends Document {
  userId?: Types.ObjectId;
  campaignPlanId?: Types.ObjectId;
  data?: any;
  created_at?: Date;
}

const ContentCalendarSchema = new Schema<IContentCalendar>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  campaignPlanId: { type: Schema.Types.ObjectId, ref: 'CampaignPlan', unique: true },
  data: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'content_calander' // Note: keeping original typo from schema
});

// Indexes
ContentCalendarSchema.index({ userId: 1 });
// Note: campaignPlanId unique index is already created by 'unique: true' in schema definition

export const CampaignPlan = model<ICampaignPlan>('CampaignPlan', CampaignPlanSchema);
export const ContentCalendar = model<IContentCalendar>('ContentCalendar', ContentCalendarSchema);
