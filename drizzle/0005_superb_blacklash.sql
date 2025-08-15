CREATE TABLE "company" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"logoUrl" text,
	"url" text,
	"contactEmail" text,
	"oneliner" text,
	"description" text,
	"isActive" boolean DEFAULT false NOT NULL,
	"createdByUserId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "company" ADD CONSTRAINT "company_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;