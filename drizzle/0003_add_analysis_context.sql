-- Add analysis_context column to brand_profiles table for Wisdom Tree integration
ALTER TABLE brand_profiles 
ADD COLUMN IF NOT EXISTS analysis_context JSONB;

-- Add comment to document the column
COMMENT ON COLUMN brand_profiles.analysis_context IS 'Wisdom Tree analysis context including entity type, persona, phase completion, and progress tracking';

