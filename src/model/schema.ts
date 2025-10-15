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
  data: jsonb('data'),
  created_at: timestamp("created_at").defaultNow()
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


// BrandProfile → BrandKits + CampaignPlans
export const brandProfilesRelations = relations(brandProfiles, ({ many, one }) => ({
  user: one(users, { fields: [brandProfiles.userId], references: [users.id] }),
  brandKits: one(brandKits),
  campaignPlans: one(campaignPlans),
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


