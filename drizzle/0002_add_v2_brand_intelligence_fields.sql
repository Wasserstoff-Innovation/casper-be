-- Add v2 brand intelligence fields to brand_profiles table
ALTER TABLE "brand_profiles" ADD COLUMN "brand_kit" jsonb;--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD COLUMN "brand_scores" jsonb;--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD COLUMN "brand_roadmap" jsonb;--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD COLUMN "status" varchar(50);--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint

