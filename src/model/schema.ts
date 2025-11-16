import { pgTable, serial, text, integer, jsonb, timestamp, varchar } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email'),
  avatar_url: text('avatar_url'),
  provider: text('provider'),
  created_at: timestamp("created_at").defaultNow()
});
export const brandProfiles = pgTable('brand_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  jobId: text('job_id'),
  profileId: text('profile_id'),
  data: jsonb('data'), // Full response data for backward compatibility
  brandKit: jsonb('brand_kit'), // v2: Complete brand documentation
  brandScores: jsonb('brand_scores'), // v2: 7-dimensional scores with status
  brandRoadmap: jsonb('brand_roadmap'), // v2: Prioritized tasks with gaps
  analysis_context: jsonb('analysis_context'), // NEW: Wisdom Tree analysis context (entity type, persona, phases, etc.)
  status: varchar('status', { length: 50 }), // Job status: queued, processing, complete, failed
  jobStartedAt: timestamp('job_started_at'), // When the job started processing
  jobCompletedAt: timestamp('job_completed_at'), // When the job finished
  jobError: text('job_error'), // Error message if job failed

  // Summary columns for fast queries (extracted from JSONB)
  canonical_domain: text('canonical_domain'),
  brand_name: text('brand_name'),
  persona_id: text('persona_id'),
  entity_type: text('entity_type'),
  business_model: text('business_model'),
  channel_orientation: text('channel_orientation'),
  overall_score: integer('overall_score'), // 0-100
  completeness_score: integer('completeness_score'), // 0-100
  total_critical_gaps: integer('total_critical_gaps'),
  has_social_profiles: integer('has_social_profiles').default(0), // 0 or 1 (boolean)
  has_blog: integer('has_blog').default(0), // 0 or 1 (boolean)
  has_review_sites: integer('has_review_sites').default(0), // 0 or 1 (boolean)

  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const brandKits = pgTable('brand_kits', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  brandProfileId: integer('brand_profile_id').references(() => brandProfiles.id).unique(),
  kitData: jsonb('kit_data'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const campaignPlans = pgTable('campaign_plans', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  brandProfileId: integer('brand_profile_id').references(() => brandProfiles.id).unique(),
  campaignId: text('campaign_id'),
  data: jsonb('data'),
  created_at: timestamp("created_at").defaultNow()
});

export const contentCalander = pgTable('content_calander', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  campaignPlanId: integer('campaign_plan_id').references(() => campaignPlans.id).unique(),
  data: jsonb('data'),
  created_at: timestamp("created_at").defaultNow()
});

export const visitedUsers = pgTable("visited_users", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  company: varchar("company", { length: 255 }),
  role: varchar("role", { length: 100 }),
  industry: varchar("industry", { length: 100 }),
  teamSize: varchar("team_size", { length: 50 }),
  currentChallenges: text("current_challenges"),
  interestedFeatures: jsonb("interested_features").$type<string[]>(),
});

export const imageGenerationJobs = pgTable('image_generation_jobs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  jobId: varchar('job_id', { length: 255 }).unique(),
  featureType: varchar('feature_type', { length: 50 }), // 'carousel', 'mascot', 'meme', 'playground', 'photography', 'print_ad'
  status: varchar('status', { length: 50 }).default('queued'),
  inputData: jsonb('input_data'),
  resultData: jsonb('result_data').default(sql`NULL`),
  errorMessage: text('error_message').default(sql`NULL`),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const carouselGenerations = pgTable('carousel_generations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  jobId: varchar('job_id', { length: 255 }).references(() => imageGenerationJobs.jobId),
  contentIdeas: jsonb('content_ideas'),
  framePrompts: jsonb('frame_prompts'),
  enhancedPrompts: jsonb('enhanced_prompts'),
  imageUrls: jsonb('image_urls'),
  brandGuidelines: jsonb('brand_guidelines'),
  productCategory: text('product_category'),
  targetAudience: text('target_audience'),
  createdAt: timestamp('created_at').defaultNow()
});

export const mascotGenerations = pgTable('mascot_generations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  jobId: varchar('job_id', { length: 255 }).references(() => imageGenerationJobs.jobId),
  prompts: jsonb('prompts'),
  selectedPrompt: text('selected_prompt'),
  finalImageUrl: text('final_image_url'),
  sessionId: varchar('session_id', { length: 255 }),
  editHistory: jsonb('edit_history'),
  brandDescription: text('brand_description'),
  visualStyle: varchar('visual_style', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow()
});
export const memeGenerations = pgTable('meme_generations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  jobId: varchar('job_id', { length: 255 }).references(() => imageGenerationJobs.jobId),
  text: text('text'),
  artStyle: varchar('art_style', { length: 50 }),
  memeConcept: text('meme_concept'),
  humorStyle: text('humor_style'),
  templateUsed: text('template_used'),
  imageUrl: text('image_url'),
  logoDesc: text('logo_desc'),
  mascotDesc: text('mascot_desc'),
  productDesc: text('product_desc'),
  createdAt: timestamp('created_at').defaultNow()
});

export const playgroundSessions = pgTable('playground_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  sessionId: varchar('session_id', { length: 255 }).unique(),
  baseImageUrl: text('base_image_url'),
  currentImageUrl: text('current_image_url'),
  historyUrls: jsonb('history_urls').default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const playgroundJobs = pgTable('playground_jobs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  jobId: varchar('job_id', { length: 255 }).references(() => imageGenerationJobs.jobId),
  sessionId: varchar('session_id', { length: 255 }).references(() => playgroundSessions.sessionId),
  type: varchar('type', { length: 20 }), // 'analysis', 'generation', 'editing'
  prompt: text('prompt'),
  referenceImageUrl: text('reference_image_url'),
  styleComponents: jsonb('style_components'),
  resultData: jsonb('result_data'),
  createdAt: timestamp('created_at').defaultNow()
});

export const photographyGenerations = pgTable('photography_generations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  jobId: varchar('job_id', { length: 255 }).references(() => imageGenerationJobs.jobId),
  productName: text('product_name'),
  photographyType: varchar('photography_type', { length: 50 }),
  backgroundColor: varchar('background_color', { length: 50 }),
  prompt: text('prompt'),
  sourceImageUrl: text('source_image_url'),
  transformedImageUrl: text('transformed_image_url'),
  createdAt: timestamp('created_at').defaultNow()
});

export const printAdGenerations = pgTable('print_ad_generations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  jobId: varchar('job_id', { length: 255 }).references(() => imageGenerationJobs.jobId),
  campaignData: jsonb('campaign_data'),
  brandGuidelines: jsonb('brand_guidelines'),
  aiOptimizedImageUrl: text('ai_optimized_image_url'),
  userInstructedImageUrl: text('user_instructed_image_url'),
  aiOptimizedPrompt: text('ai_optimized_prompt'),
  userInstructedPrompt: text('user_instructed_prompt'),
  createdAt: timestamp('created_at').defaultNow()
});

// Brand Roadmap Campaigns - Normalized from brand_roadmap JSONB
export const brandRoadmapCampaigns = pgTable('brand_roadmap_campaigns', {
  id: text('id').primaryKey(), // campaign.id from roadmap
  brandProfileId: integer('brand_profile_id').references(() => brandProfiles.id).notNull(),
  persona: text('persona'),
  title: text('title'),
  shortTitle: text('short_title'),
  description: text('description'),
  category: text('category'),
  recommendedOrder: integer('recommended_order'),
  estimatedTimeline: text('estimated_timeline'),
  dimensionsAffected: jsonb('dimensions_affected').$type<string[]>(),
  priorityScore: integer('priority_score'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Brand Roadmap Milestones
export const brandRoadmapMilestones = pgTable('brand_roadmap_milestones', {
  id: text('id').primaryKey(), // milestone.id
  campaignId: text('campaign_id').references(() => brandRoadmapCampaigns.id).notNull(),
  title: text('title'),
  goal: text('goal'),
  estimatedDuration: text('estimated_duration'),
  orderIndex: integer('order_index'),
  totalTasks: integer('total_tasks'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Brand Roadmap Tasks
export const brandRoadmapTasks = pgTable('brand_roadmap_tasks', {
  id: text('id').primaryKey(), // task.id
  brandProfileId: integer('brand_profile_id').references(() => brandProfiles.id).notNull(),
  campaignId: text('campaign_id').references(() => brandRoadmapCampaigns.id),
  milestoneId: text('milestone_id').references(() => brandRoadmapMilestones.id),

  title: text('title'),
  description: text('description'),
  category: text('category'), // research | copy | design | dev | ops | outreach
  impact: text('impact'), // low | medium | high
  effort: text('effort'), // low | medium | high
  targets: jsonb('targets').$type<string[]>(), // ["verbal_identity.tagline", ...]
  suggestedOwner: text('suggested_owner'), // founder | marketing | design
  suggestedTools: jsonb('suggested_tools').$type<string[]>(), // ["ai_copywriter","crm"]
  priorityScore: integer('priority_score'),
  status: varchar('status', { length: 50 }).default('pending'), // pending | in_progress | completed | skipped
  dependsOn: jsonb('depends_on').$type<string[]>(), // ["other_task_id"]
  acceptanceCriteria: text('acceptance_criteria'),

  isQuickWin: integer('is_quick_win').default(0), // 0 or 1 (boolean)

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Brand Social Profiles - Normalized from external_presence
export const brandSocialProfiles = pgTable('brand_social_profiles', {
  id: serial('id').primaryKey(),
  brandProfileId: integer('brand_profile_id').references(() => brandProfiles.id).notNull(),
  platform: text('platform'), // LinkedIn, Twitter, Instagram, YouTube
  profileType: text('profile_type'), // company | personal
  url: text('url'),
  status: text('status'), // found | inferred | missing
  source: jsonb('source').$type<string[]>(), // ["onsite","web_search"]
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// // User → BrandProfiles
export const usersRelations = relations(users, ({ many }) => ({
  brandProfiles: many(brandProfiles),
  brandKits: many(brandKits),
  campaignPlans: many(campaignPlans),
  contentCalander: many(contentCalander),
  imageGenerationJobs: many(imageGenerationJobs),
  carouselGenerations: many(carouselGenerations),
  mascotGenerations: many(mascotGenerations),
  memeGenerations: many(memeGenerations),
  playgroundSessions: many(playgroundSessions),
  playgroundJobs: many(playgroundJobs),
  photographyGenerations: many(photographyGenerations),
  printAdGenerations: many(printAdGenerations),
}));


// BrandProfile → BrandKits + CampaignPlans + Roadmap + SocialProfiles
export const brandProfilesRelations = relations(brandProfiles, ({ many, one }) => ({
  user: one(users, { fields: [brandProfiles.userId], references: [users.id] }),
  brandKits: one(brandKits),
  campaignPlans: one(campaignPlans),
  roadmapCampaigns: many(brandRoadmapCampaigns),
  roadmapTasks: many(brandRoadmapTasks),
  socialProfiles: many(brandSocialProfiles),
}));

// BrandKit → User, BrandProfile
export const brandKitsRelations = relations(brandKits, ({ one }) => ({
  user: one(users, { fields: [brandKits.userId], references: [users.id] }),
  brandProfile: one(brandProfiles, { fields: [brandKits.brandProfileId], references: [brandProfiles.id] }),
}));

// CampaignPlan → User, BrandProfile, ContentCalendar (many)
export const campaignPlansRelations = relations(campaignPlans, ({ one, many }) => ({
  user: one(users, { fields: [campaignPlans.userId], references: [users.id] }),
  brandProfile: one(brandProfiles, { fields: [campaignPlans.brandProfileId], references: [brandProfiles.id] }),
  contentCalander: one(contentCalander),
}));

// ContentCalendar → CampaignPlan, User
export const contentCalanderRelations = relations(contentCalander, ({ one }) => ({
  campaignPlan: one(campaignPlans, { fields: [contentCalander.campaignPlanId], references: [campaignPlans.id] }),
  user: one(users, { fields: [contentCalander.userId], references: [users.id] }),
}));

export const imageGenerationJobsRelations = relations(imageGenerationJobs, ({ one }) => ({
  user: one(users, { fields: [imageGenerationJobs.userId], references: [users.id] }),
  
  carousel: one(carouselGenerations, {
    fields: [imageGenerationJobs.jobId],
    references: [carouselGenerations.jobId],
  }),
  
  mascot: one(mascotGenerations, {
    fields: [imageGenerationJobs.jobId],
    references: [mascotGenerations.jobId],
  }),
  
  meme: one(memeGenerations, {
    fields: [imageGenerationJobs.jobId],
    references: [memeGenerations.jobId],
  }),

  photography: one(photographyGenerations, {
    fields: [imageGenerationJobs.jobId],
    references: [photographyGenerations.jobId],
  }),

  printAd: one(printAdGenerations, {
    fields: [imageGenerationJobs.jobId],
    references: [printAdGenerations.jobId],
  }),

  playgroundJob: one(playgroundJobs, {
    fields: [imageGenerationJobs.jobId],
    references: [playgroundJobs.jobId],
  }),
}));

// Roadmap Campaign Relations
export const brandRoadmapCampaignsRelations = relations(brandRoadmapCampaigns, ({ one, many }) => ({
  brandProfile: one(brandProfiles, { fields: [brandRoadmapCampaigns.brandProfileId], references: [brandProfiles.id] }),
  milestones: many(brandRoadmapMilestones),
  tasks: many(brandRoadmapTasks),
}));

// Roadmap Milestone Relations
export const brandRoadmapMilestonesRelations = relations(brandRoadmapMilestones, ({ one, many }) => ({
  campaign: one(brandRoadmapCampaigns, { fields: [brandRoadmapMilestones.campaignId], references: [brandRoadmapCampaigns.id] }),
  tasks: many(brandRoadmapTasks),
}));

// Roadmap Task Relations
export const brandRoadmapTasksRelations = relations(brandRoadmapTasks, ({ one }) => ({
  brandProfile: one(brandProfiles, { fields: [brandRoadmapTasks.brandProfileId], references: [brandProfiles.id] }),
  campaign: one(brandRoadmapCampaigns, { fields: [brandRoadmapTasks.campaignId], references: [brandRoadmapCampaigns.id] }),
  milestone: one(brandRoadmapMilestones, { fields: [brandRoadmapTasks.milestoneId], references: [brandRoadmapMilestones.id] }),
}));

// Social Profiles Relations
export const brandSocialProfilesRelations = relations(brandSocialProfiles, ({ one }) => ({
  brandProfile: one(brandProfiles, { fields: [brandSocialProfiles.brandProfileId], references: [brandProfiles.id] }),
}));
