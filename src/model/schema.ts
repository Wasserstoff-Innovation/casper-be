import { pgTable, serial, text, integer, jsonb, timestamp, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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

// // User → BrandProfiles
export const usersRelations = relations(users, ({ many }) => ({
  brandProfiles: many(brandProfiles),
  brandKits: many(brandKits),
  campaignPlans: many(campaignPlans),
  contentCalander: many(contentCalander),
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

