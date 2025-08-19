ALTER TABLE "user" ADD COLUMN "onboardingCompleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "vibeTags" jsonb;