import { Schema, model, Document, Types } from 'mongoose';

// Campaign Model
export interface IBrandRoadmapCampaign extends Omit<Document, '_id'> {
  _id: string; // Use string ID to match original schema
  brandProfileId: Types.ObjectId;
  persona?: string;
  title?: string;
  shortTitle?: string;
  description?: string;
  category?: string;
  recommendedOrder?: number;
  estimatedTimeline?: string;
  dimensionsAffected?: string[];
  priorityScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const BrandRoadmapCampaignSchema = new Schema<IBrandRoadmapCampaign>({
  _id: { type: String, required: true },
  brandProfileId: { type: Schema.Types.ObjectId, ref: 'BrandProfile', required: true },
  persona: { type: String },
  title: { type: String },
  shortTitle: { type: String },
  description: { type: String },
  category: { type: String },
  recommendedOrder: { type: Number },
  estimatedTimeline: { type: String },
  dimensionsAffected: [{ type: String }],
  priorityScore: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'brand_roadmap_campaigns',
  _id: false // Disable auto-generation of _id
});

BrandRoadmapCampaignSchema.index({ brandProfileId: 1 });

// Milestone Model
export interface IBrandRoadmapMilestone extends Omit<Document, '_id'> {
  _id: string;
  campaignId: string;
  title?: string;
  goal?: string;
  estimatedDuration?: string;
  orderIndex?: number;
  totalTasks?: number;
  createdAt: Date;
  updatedAt: Date;
}

const BrandRoadmapMilestoneSchema = new Schema<IBrandRoadmapMilestone>({
  _id: { type: String, required: true },
  campaignId: { type: String, ref: 'BrandRoadmapCampaign', required: true },
  title: { type: String },
  goal: { type: String },
  estimatedDuration: { type: String },
  orderIndex: { type: Number },
  totalTasks: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'brand_roadmap_milestones',
  _id: false
});

BrandRoadmapMilestoneSchema.index({ campaignId: 1 });

// Task Model
export interface IBrandRoadmapTask extends Omit<Document, '_id'> {
  _id: string;
  brandProfileId: Types.ObjectId;
  taskId?: string; // task_id field (e.g., "improve_features_clarity")
  campaignId?: string;
  milestoneId?: string;
  title?: string;
  description?: string;
  category?: string; // messaging, visual, technical, etc.
  impact?: string; // low, medium, high
  effort?: string; // low, medium, high
  targets?: string[];
  suggestedOwner?: string;
  suggestedTools?: string[];
  priorityScore?: number;
  type?: string; // quick_win, project, long_term
  status?: string; // pending, in_progress, completed
  dependsOn?: string[];
  acceptanceCriteria?: string;
  isQuickWin?: number; // Deprecated: use type === 'quick_win' instead
  createdAt: Date;
  updatedAt: Date;
}

const BrandRoadmapTaskSchema = new Schema<IBrandRoadmapTask>({
  _id: { type: String, required: true },
  brandProfileId: { type: Schema.Types.ObjectId, ref: 'BrandProfile', required: true },
  taskId: { type: String },
  campaignId: { type: String, ref: 'BrandRoadmapCampaign' },
  milestoneId: { type: String, ref: 'BrandRoadmapMilestone' },
  title: { type: String },
  description: { type: String },
  category: { type: String },
  impact: { type: String },
  effort: { type: String },
  targets: [{ type: String }],
  suggestedOwner: { type: String },
  suggestedTools: [{ type: String }],
  priorityScore: { type: Number },
  type: { type: String }, // quick_win, project, long_term
  status: { type: String, maxlength: 50, default: 'pending' },
  dependsOn: [{ type: String }],
  acceptanceCriteria: { type: String },
  isQuickWin: { type: Number, default: 0 }, // Deprecated
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'brand_roadmap_tasks',
  _id: false
});

BrandRoadmapTaskSchema.index({ brandProfileId: 1 });
BrandRoadmapTaskSchema.index({ campaignId: 1 });
BrandRoadmapTaskSchema.index({ type: 1 }); // Index on new type field
BrandRoadmapTaskSchema.index({ isQuickWin: 1 }); // Keep for backward compatibility
BrandRoadmapTaskSchema.index({ status: 1 });
BrandRoadmapTaskSchema.index({ taskId: 1 }); // Index on taskId for lookups

export const BrandRoadmapCampaign = model<IBrandRoadmapCampaign>('BrandRoadmapCampaign', BrandRoadmapCampaignSchema);
export const BrandRoadmapMilestone = model<IBrandRoadmapMilestone>('BrandRoadmapMilestone', BrandRoadmapMilestoneSchema);
export const BrandRoadmapTask = model<IBrandRoadmapTask>('BrandRoadmapTask', BrandRoadmapTaskSchema);
