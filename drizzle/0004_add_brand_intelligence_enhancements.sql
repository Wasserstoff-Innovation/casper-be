-- Migration: Add Brand Intelligence Enhancements
-- Date: 2025-11-15
-- Description: Add summary columns to brand_profiles and create relational tables for roadmap and social profiles

-- ============================================================================
-- 1. Add summary columns to brand_profiles for fast queries
-- ============================================================================
ALTER TABLE brand_profiles
  ADD COLUMN canonical_domain text,
  ADD COLUMN brand_name text,
  ADD COLUMN persona_id text,
  ADD COLUMN entity_type text,
  ADD COLUMN business_model text,
  ADD COLUMN channel_orientation text,
  ADD COLUMN overall_score integer,
  ADD COLUMN completeness_score integer,
  ADD COLUMN total_critical_gaps integer,
  ADD COLUMN has_social_profiles integer DEFAULT 0,
  ADD COLUMN has_blog integer DEFAULT 0,
  ADD COLUMN has_review_sites integer DEFAULT 0;

-- Add indexes for common query patterns
CREATE INDEX idx_brand_profiles_canonical_domain ON brand_profiles(canonical_domain);
CREATE INDEX idx_brand_profiles_brand_name ON brand_profiles(brand_name);
CREATE INDEX idx_brand_profiles_persona_id ON brand_profiles(persona_id);
CREATE INDEX idx_brand_profiles_entity_type ON brand_profiles(entity_type);
CREATE INDEX idx_brand_profiles_overall_score ON brand_profiles(overall_score);
CREATE INDEX idx_brand_profiles_completeness_score ON brand_profiles(completeness_score);

-- ============================================================================
-- 2. Create brand_roadmap_campaigns table
-- ============================================================================
CREATE TABLE brand_roadmap_campaigns (
  id text PRIMARY KEY,
  brand_profile_id integer NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  persona text,
  title text,
  short_title text,
  description text,
  category text,
  recommended_order integer,
  estimated_timeline text,
  dimensions_affected jsonb,
  priority_score integer,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

CREATE INDEX idx_brand_roadmap_campaigns_profile_id ON brand_roadmap_campaigns(brand_profile_id);
CREATE INDEX idx_brand_roadmap_campaigns_category ON brand_roadmap_campaigns(category);

-- ============================================================================
-- 3. Create brand_roadmap_milestones table
-- ============================================================================
CREATE TABLE brand_roadmap_milestones (
  id text PRIMARY KEY,
  campaign_id text NOT NULL REFERENCES brand_roadmap_campaigns(id) ON DELETE CASCADE,
  title text,
  goal text,
  estimated_duration text,
  order_index integer,
  total_tasks integer,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

CREATE INDEX idx_brand_roadmap_milestones_campaign_id ON brand_roadmap_milestones(campaign_id);

-- ============================================================================
-- 4. Create brand_roadmap_tasks table
-- ============================================================================
CREATE TABLE brand_roadmap_tasks (
  id text PRIMARY KEY,
  brand_profile_id integer NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  campaign_id text REFERENCES brand_roadmap_campaigns(id) ON DELETE CASCADE,
  milestone_id text REFERENCES brand_roadmap_milestones(id) ON DELETE CASCADE,
  title text,
  description text,
  category text,
  impact text,
  effort text,
  targets jsonb,
  suggested_owner text,
  suggested_tools jsonb,
  priority_score integer,
  status varchar(50) DEFAULT 'pending',
  depends_on jsonb,
  acceptance_criteria text,
  is_quick_win integer DEFAULT 0,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

CREATE INDEX idx_brand_roadmap_tasks_profile_id ON brand_roadmap_tasks(brand_profile_id);
CREATE INDEX idx_brand_roadmap_tasks_campaign_id ON brand_roadmap_tasks(campaign_id);
CREATE INDEX idx_brand_roadmap_tasks_milestone_id ON brand_roadmap_tasks(milestone_id);
CREATE INDEX idx_brand_roadmap_tasks_status ON brand_roadmap_tasks(status);
CREATE INDEX idx_brand_roadmap_tasks_is_quick_win ON brand_roadmap_tasks(is_quick_win);
CREATE INDEX idx_brand_roadmap_tasks_category ON brand_roadmap_tasks(category);

-- ============================================================================
-- 5. Create brand_social_profiles table
-- ============================================================================
CREATE TABLE brand_social_profiles (
  id serial PRIMARY KEY,
  brand_profile_id integer NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  platform text,
  profile_type text,
  url text,
  status text,
  source jsonb,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

CREATE INDEX idx_brand_social_profiles_profile_id ON brand_social_profiles(brand_profile_id);
CREATE INDEX idx_brand_social_profiles_platform ON brand_social_profiles(platform);
CREATE INDEX idx_brand_social_profiles_status ON brand_social_profiles(status);
