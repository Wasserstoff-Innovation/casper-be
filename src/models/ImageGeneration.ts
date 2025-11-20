import { Schema, model, Document, Types } from 'mongoose';

// Image Generation Job
export interface IImageGenerationJob extends Document {
  userId?: Types.ObjectId;
  jobId: string;
  featureType?: string; // 'carousel', 'mascot', 'meme', 'playground', 'photography', 'print_ad'
  status?: string;
  inputData?: any;
  resultData?: any;
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ImageGenerationJobSchema = new Schema<IImageGenerationJob>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  jobId: { type: String, required: true, unique: true, maxlength: 255 },
  featureType: { type: String, maxlength: 50 },
  status: { type: String, maxlength: 50, default: 'queued' },
  inputData: { type: Schema.Types.Mixed },
  resultData: { type: Schema.Types.Mixed, default: null },
  errorMessage: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'image_generation_jobs'
});

ImageGenerationJobSchema.index({ userId: 1, createdAt: -1 });
// Note: jobId unique index is already created by 'unique: true' in schema definition
ImageGenerationJobSchema.index({ featureType: 1 });

// Carousel Generation
export interface ICarouselGeneration extends Document {
  userId?: Types.ObjectId;
  jobId?: string;
  contentIdeas?: any;
  framePrompts?: any;
  enhancedPrompts?: any;
  imageUrls?: any;
  brandGuidelines?: any;
  productCategory?: string;
  targetAudience?: string;
  createdAt?: Date;
}

const CarouselGenerationSchema = new Schema<ICarouselGeneration>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  jobId: { type: String, maxlength: 255 },
  contentIdeas: { type: Schema.Types.Mixed },
  framePrompts: { type: Schema.Types.Mixed },
  enhancedPrompts: { type: Schema.Types.Mixed },
  imageUrls: { type: Schema.Types.Mixed },
  brandGuidelines: { type: Schema.Types.Mixed },
  productCategory: { type: String },
  targetAudience: { type: String },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'carousel_generations'
});

CarouselGenerationSchema.index({ userId: 1 });
CarouselGenerationSchema.index({ jobId: 1 });

// Mascot Generation
export interface IMascotGeneration extends Document {
  userId?: Types.ObjectId;
  jobId?: string;
  prompts?: any;
  selectedPrompt?: string;
  finalImageUrl?: string;
  sessionId?: string;
  editHistory?: any;
  brandDescription?: string;
  visualStyle?: string;
  createdAt?: Date;
}

const MascotGenerationSchema = new Schema<IMascotGeneration>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  jobId: { type: String, maxlength: 255 },
  prompts: { type: Schema.Types.Mixed },
  selectedPrompt: { type: String },
  finalImageUrl: { type: String },
  sessionId: { type: String, maxlength: 255 },
  editHistory: { type: Schema.Types.Mixed },
  brandDescription: { type: String },
  visualStyle: { type: String, maxlength: 50 },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'mascot_generations'
});

MascotGenerationSchema.index({ userId: 1 });
MascotGenerationSchema.index({ jobId: 1 });

// Meme Generation
export interface IMemeGeneration extends Document {
  userId?: Types.ObjectId;
  jobId?: string;
  text?: string;
  artStyle?: string;
  memeConcept?: string;
  humorStyle?: string;
  templateUsed?: string;
  imageUrl?: string;
  logoDesc?: string;
  mascotDesc?: string;
  productDesc?: string;
  createdAt?: Date;
}

const MemeGenerationSchema = new Schema<IMemeGeneration>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  jobId: { type: String, maxlength: 255 },
  text: { type: String },
  artStyle: { type: String, maxlength: 50 },
  memeConcept: { type: String },
  humorStyle: { type: String },
  templateUsed: { type: String },
  imageUrl: { type: String },
  logoDesc: { type: String },
  mascotDesc: { type: String },
  productDesc: { type: String },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'meme_generations'
});

MemeGenerationSchema.index({ userId: 1 });
MemeGenerationSchema.index({ jobId: 1 });

// Playground Session
export interface IPlaygroundSession extends Document {
  userId?: Types.ObjectId;
  sessionId: string;
  baseImageUrl?: string;
  currentImageUrl?: string;
  historyUrls?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

const PlaygroundSessionSchema = new Schema<IPlaygroundSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String, required: true, unique: true, maxlength: 255 },
  baseImageUrl: { type: String },
  currentImageUrl: { type: String },
  historyUrls: { type: [Schema.Types.Mixed], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'playground_sessions'
});

PlaygroundSessionSchema.index({ userId: 1 });
// Note: sessionId unique index is already created by 'unique: true' in schema definition

// Playground Job
export interface IPlaygroundJob extends Document {
  userId?: Types.ObjectId;
  jobId?: string;
  sessionId?: string;
  type?: string; // 'analysis', 'generation', 'editing'
  prompt?: string;
  referenceImageUrl?: string;
  styleComponents?: any;
  resultData?: any;
  createdAt?: Date;
}

const PlaygroundJobSchema = new Schema<IPlaygroundJob>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  jobId: { type: String, maxlength: 255 },
  sessionId: { type: String, maxlength: 255 },
  type: { type: String, maxlength: 20 },
  prompt: { type: String },
  referenceImageUrl: { type: String },
  styleComponents: { type: Schema.Types.Mixed },
  resultData: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'playground_jobs'
});

PlaygroundJobSchema.index({ userId: 1 });
PlaygroundJobSchema.index({ jobId: 1 });
PlaygroundJobSchema.index({ sessionId: 1 });

// Photography Generation
export interface IPhotographyGeneration extends Document {
  userId?: Types.ObjectId;
  jobId?: string;
  productName?: string;
  photographyType?: string;
  backgroundColor?: string;
  prompt?: string;
  sourceImageUrl?: string;
  transformedImageUrl?: string;
  createdAt?: Date;
}

const PhotographyGenerationSchema = new Schema<IPhotographyGeneration>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  jobId: { type: String, maxlength: 255 },
  productName: { type: String },
  photographyType: { type: String, maxlength: 50 },
  backgroundColor: { type: String, maxlength: 50 },
  prompt: { type: String },
  sourceImageUrl: { type: String },
  transformedImageUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'photography_generations'
});

PhotographyGenerationSchema.index({ userId: 1 });
PhotographyGenerationSchema.index({ jobId: 1 });

// Print Ad Generation
export interface IPrintAdGeneration extends Document {
  userId?: Types.ObjectId;
  jobId?: string;
  campaignData?: any;
  brandGuidelines?: any;
  aiOptimizedImageUrl?: string;
  userInstructedImageUrl?: string;
  aiOptimizedPrompt?: string;
  userInstructedPrompt?: string;
  createdAt?: Date;
}

const PrintAdGenerationSchema = new Schema<IPrintAdGeneration>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  jobId: { type: String, maxlength: 255 },
  campaignData: { type: Schema.Types.Mixed },
  brandGuidelines: { type: Schema.Types.Mixed },
  aiOptimizedImageUrl: { type: String },
  userInstructedImageUrl: { type: String },
  aiOptimizedPrompt: { type: String },
  userInstructedPrompt: { type: String },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'print_ad_generations'
});

PrintAdGenerationSchema.index({ userId: 1 });
PrintAdGenerationSchema.index({ jobId: 1 });

// Export models
export const ImageGenerationJob = model<IImageGenerationJob>('ImageGenerationJob', ImageGenerationJobSchema);
export const CarouselGeneration = model<ICarouselGeneration>('CarouselGeneration', CarouselGenerationSchema);
export const MascotGeneration = model<IMascotGeneration>('MascotGeneration', MascotGenerationSchema);
export const MemeGeneration = model<IMemeGeneration>('MemeGeneration', MemeGenerationSchema);
export const PlaygroundSession = model<IPlaygroundSession>('PlaygroundSession', PlaygroundSessionSchema);
export const PlaygroundJob = model<IPlaygroundJob>('PlaygroundJob', PlaygroundJobSchema);
export const PhotographyGeneration = model<IPhotographyGeneration>('PhotographyGeneration', PhotographyGenerationSchema);
export const PrintAdGeneration = model<IPrintAdGeneration>('PrintAdGeneration', PrintAdGenerationSchema);
