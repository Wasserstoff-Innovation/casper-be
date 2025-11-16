-- Add job tracking columns to brand_profiles table
-- This enables tracking job history, status, and retry logic

ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS job_id text,
  ADD COLUMN IF NOT EXISTS job_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS job_started_at timestamp,
  ADD COLUMN IF NOT EXISTS job_completed_at timestamp,
  ADD COLUMN IF NOT EXISTS job_error text;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_profiles_job_id ON brand_profiles(job_id);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_created ON brand_profiles(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_status ON brand_profiles(job_status);
