CREATE TABLE "brand_kits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"brand_profile_id" integer,
	"kit_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "brand_kits_brand_profile_id_unique" UNIQUE("brand_profile_id")
);
--> statement-breakpoint
CREATE TABLE "brand_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"job_id" text,
	"profile_id" text,
	"data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"brand_profile_id" integer,
	"campaign_id" text,
	"data" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "campaign_plans_brand_profile_id_unique" UNIQUE("brand_profile_id")
);
--> statement-breakpoint
CREATE TABLE "carousel_generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"job_id" varchar(255),
	"content_ideas" jsonb,
	"frame_prompts" jsonb,
	"enhanced_prompts" jsonb,
	"image_urls" jsonb,
	"brand_guidelines" jsonb,
	"product_category" text,
	"target_audience" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_calander" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"campaign_plan_id" integer,
	"data" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "content_calander_campaign_plan_id_unique" UNIQUE("campaign_plan_id")
);
--> statement-breakpoint
CREATE TABLE "image_generation_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"job_id" varchar(255),
	"feature_type" varchar(50),
	"status" varchar(50) DEFAULT 'queued',
	"input_data" jsonb,
	"result_data" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "image_generation_jobs_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "mascot_generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"job_id" varchar(255),
	"prompts" jsonb,
	"selected_prompt" text,
	"final_image_url" text,
	"session_id" varchar(255),
	"edit_history" jsonb,
	"brand_description" text,
	"visual_style" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meme_generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"job_id" varchar(255),
	"text" text,
	"art_style" varchar(50),
	"meme_concept" text,
	"humor_style" text,
	"template_used" text,
	"image_url" text,
	"logo_desc" text,
	"mascot_desc" text,
	"product_desc" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "photography_generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"job_id" varchar(255),
	"product_name" text,
	"photography_type" varchar(50),
	"background_color" varchar(50),
	"prompt" text,
	"source_image_url" text,
	"transformed_image_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "playground_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"job_id" varchar(255),
	"session_id" varchar(255),
	"type" varchar(20),
	"prompt" text,
	"reference_image_url" text,
	"style_components" jsonb,
	"result_data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "playground_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"session_id" varchar(255),
	"base_image_url" text,
	"current_image_url" text,
	"history_urls" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "playground_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "print_ad_generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"job_id" varchar(255),
	"campaign_data" jsonb,
	"brand_guidelines" jsonb,
	"ai_optimized_image_url" text,
	"user_instructed_image_url" text,
	"ai_optimized_prompt" text,
	"user_instructed_prompt" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"avatar_url" text,
	"provider" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "visited_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"email" varchar(255) NOT NULL,
	"phone_number" varchar(20),
	"company" varchar(255),
	"role" varchar(100),
	"industry" varchar(100),
	"team_size" varchar(50),
	"current_challenges" text,
	"interested_features" jsonb,
	CONSTRAINT "visited_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "brand_kits" ADD CONSTRAINT "brand_kits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_kits" ADD CONSTRAINT "brand_kits_brand_profile_id_brand_profiles_id_fk" FOREIGN KEY ("brand_profile_id") REFERENCES "public"."brand_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_plans" ADD CONSTRAINT "campaign_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_plans" ADD CONSTRAINT "campaign_plans_brand_profile_id_brand_profiles_id_fk" FOREIGN KEY ("brand_profile_id") REFERENCES "public"."brand_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousel_generations" ADD CONSTRAINT "carousel_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousel_generations" ADD CONSTRAINT "carousel_generations_job_id_image_generation_jobs_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."image_generation_jobs"("job_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_calander" ADD CONSTRAINT "content_calander_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_calander" ADD CONSTRAINT "content_calander_campaign_plan_id_campaign_plans_id_fk" FOREIGN KEY ("campaign_plan_id") REFERENCES "public"."campaign_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_generation_jobs" ADD CONSTRAINT "image_generation_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mascot_generations" ADD CONSTRAINT "mascot_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mascot_generations" ADD CONSTRAINT "mascot_generations_job_id_image_generation_jobs_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."image_generation_jobs"("job_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meme_generations" ADD CONSTRAINT "meme_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meme_generations" ADD CONSTRAINT "meme_generations_job_id_image_generation_jobs_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."image_generation_jobs"("job_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photography_generations" ADD CONSTRAINT "photography_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photography_generations" ADD CONSTRAINT "photography_generations_job_id_image_generation_jobs_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."image_generation_jobs"("job_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playground_jobs" ADD CONSTRAINT "playground_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playground_jobs" ADD CONSTRAINT "playground_jobs_job_id_image_generation_jobs_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."image_generation_jobs"("job_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playground_jobs" ADD CONSTRAINT "playground_jobs_session_id_playground_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."playground_sessions"("session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playground_sessions" ADD CONSTRAINT "playground_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_ad_generations" ADD CONSTRAINT "print_ad_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_ad_generations" ADD CONSTRAINT "print_ad_generations_job_id_image_generation_jobs_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."image_generation_jobs"("job_id") ON DELETE no action ON UPDATE no action;