CREATE TABLE "brand_kits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"brand_profile_id" integer,
	"kit_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
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
	"data" jsonb,
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
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"avatar_url" text,
	"provider" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "brand_kits" ADD CONSTRAINT "brand_kits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_kits" ADD CONSTRAINT "brand_kits_brand_profile_id_brand_profiles_id_fk" FOREIGN KEY ("brand_profile_id") REFERENCES "public"."brand_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_plans" ADD CONSTRAINT "campaign_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_plans" ADD CONSTRAINT "campaign_plans_brand_profile_id_brand_profiles_id_fk" FOREIGN KEY ("brand_profile_id") REFERENCES "public"."brand_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_calander" ADD CONSTRAINT "content_calander_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_calander" ADD CONSTRAINT "content_calander_campaign_plan_id_campaign_plans_id_fk" FOREIGN KEY ("campaign_plan_id") REFERENCES "public"."campaign_plans"("id") ON DELETE no action ON UPDATE no action;