CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"oneliner" text,
	"description" text,
	"media" jsonb DEFAULT '[]'::jsonb,
	"featured" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;