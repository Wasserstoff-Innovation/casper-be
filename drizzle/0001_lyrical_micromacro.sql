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
