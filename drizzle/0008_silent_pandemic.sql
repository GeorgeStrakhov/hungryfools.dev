CREATE TABLE "embedding_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"entityType" text NOT NULL,
	"entityId" text NOT NULL,
	"action" text NOT NULL,
	"contentHash" text,
	"error" text,
	"processingTimeMs" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_embeddings" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"embedding" vector(1024) NOT NULL,
	"contentHash" text NOT NULL,
	"contentPreview" text NOT NULL,
	"embeddingModel" text DEFAULT '@cf/baai/bge-m3' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_embeddings" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"userId" text NOT NULL,
	"embedding" vector(1024) NOT NULL,
	"contentHash" text NOT NULL,
	"contentPreview" text NOT NULL,
	"embeddingModel" text DEFAULT '@cf/baai/bge-m3' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_embeddings" ADD CONSTRAINT "profile_embeddings_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_embeddings" ADD CONSTRAINT "project_embeddings_projectId_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "profile_embeddings_user_idx" ON "profile_embeddings" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "profile_embeddings_embedding_idx" ON "profile_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "project_embeddings_project_idx" ON "project_embeddings" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "project_embeddings_embedding_idx" ON "project_embeddings" USING hnsw ("embedding" vector_cosine_ops);