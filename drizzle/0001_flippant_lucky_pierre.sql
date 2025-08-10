CREATE TABLE "profile" (
	"userId" text PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"displayName" text,
	"headline" text,
	"bio" text,
	"skills" jsonb,
	"interests" jsonb,
	"location" text,
	"links" jsonb,
	"availability" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;