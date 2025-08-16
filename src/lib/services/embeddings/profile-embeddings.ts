import { db } from "@/db";
import { profiles, projects, profileEmbeddings, projectEmbeddings, embeddingLogs } from "@/db/schema/profile";
import { eq } from "drizzle-orm";
import { generateEmbeddings } from "./embeddings";
import crypto from "crypto";

// Types
export interface ProfileWithProjects {
  userId: string;
  handle: string;
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  skills: string[] | null;
  interests: string[] | null;
  location: string | null;
  availability: {
    hire?: boolean;
    collab?: boolean;
    hiring?: boolean;
  } | null;
  projects?: Array<{
    name: string;
    oneliner: string | null;
    description: string | null;
  }>;
}

export interface ProjectData {
  id: string;
  userId: string;
  name: string;
  oneliner: string | null;
  description: string | null;
  url: string | null;
}

/**
 * Generate content string for profile embedding
 * This creates a rich text representation of the profile for semantic search
 */
export function buildProfileEmbeddingContent(profile: ProfileWithProjects): string {
  const parts: string[] = [];
  
  // Core identity
  if (profile.displayName) {
    parts.push(profile.displayName);
  }
  
  if (profile.headline) {
    parts.push(profile.headline);
  }
  
  // Location
  if (profile.location) {
    parts.push(`Based in ${profile.location}`);
  }
  
  // Skills
  if (profile.skills && profile.skills.length > 0) {
    parts.push(`Skills: ${profile.skills.join(", ")}`);
  }
  
  // Interests
  if (profile.interests && profile.interests.length > 0) {
    parts.push(`Interests: ${profile.interests.join(", ")}`);
  }
  
  // Bio
  if (profile.bio) {
    parts.push(profile.bio);
  }
  
  // Availability
  const availabilityParts: string[] = [];
  if (profile.availability?.hire) availabilityParts.push("available for hire");
  if (profile.availability?.collab) availabilityParts.push("open to collaboration");
  if (profile.availability?.hiring) availabilityParts.push("hiring");
  if (availabilityParts.length > 0) {
    parts.push(`Currently ${availabilityParts.join(" and ")}`);
  }
  
  // Projects
  if (profile.projects && profile.projects.length > 0) {
    const projectDescriptions = profile.projects
      .slice(0, 3) // Include top 3 projects
      .map(p => {
        const projectParts = [p.name];
        if (p.oneliner) projectParts.push(p.oneliner);
        return projectParts.join(": ");
      });
    parts.push(`Projects: ${projectDescriptions.join(". ")}`);
  }
  
  return parts.filter(Boolean).join(". ");
}

/**
 * Generate content string for project embedding
 */
export function buildProjectEmbeddingContent(
  project: ProjectData,
  ownerProfile?: { displayName: string | null; location: string | null }
): string {
  const parts: string[] = [];
  
  // Project name and tagline
  parts.push(project.name);
  if (project.oneliner) {
    parts.push(project.oneliner);
  }
  
  // Full description
  if (project.description) {
    parts.push(project.description);
  }
  
  // Add context about the creator if available
  if (ownerProfile) {
    const contextParts: string[] = [];
    if (ownerProfile.displayName) {
      contextParts.push(`Created by ${ownerProfile.displayName}`);
    }
    if (ownerProfile.location) {
      contextParts.push(`based in ${ownerProfile.location}`);
    }
    if (contextParts.length > 0) {
      parts.push(contextParts.join(" "));
    }
  }
  
  return parts.filter(Boolean).join(". ");
}

/**
 * Calculate SHA-256 hash of content for change detection
 */
function calculateContentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Generate or update embedding for a profile
 */
export async function generateProfileEmbedding(userId: string): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Fetch profile with projects
    const profileData = await db
      .select({
        userId: profiles.userId,
        handle: profiles.handle,
        displayName: profiles.displayName,
        headline: profiles.headline,
        bio: profiles.bio,
        skills: profiles.skills,
        interests: profiles.interests,
        location: profiles.location,
        availability: profiles.availability,
      })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    
    if (profileData.length === 0) {
      throw new Error(`Profile not found for userId: ${userId}`);
    }
    
    const profile = profileData[0];
    
    // Fetch user's projects
    const userProjects = await db
      .select({
        name: projects.name,
        oneliner: projects.oneliner,
        description: projects.description,
      })
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(projects.featured, projects.createdAt)
      .limit(3);
    
    const profileWithProjects: ProfileWithProjects = {
      ...profile,
      projects: userProjects,
    };
    
    // Generate content and hash
    const content = buildProfileEmbeddingContent(profileWithProjects);
    const contentHash = calculateContentHash(content);
    
    // Check if embedding exists and if content has changed
    const existingEmbedding = await db
      .select({
        id: profileEmbeddings.id,
        contentHash: profileEmbeddings.contentHash,
      })
      .from(profileEmbeddings)
      .where(eq(profileEmbeddings.userId, userId))
      .limit(1);
    
    // Skip if content hasn't changed
    if (existingEmbedding.length > 0 && existingEmbedding[0].contentHash === contentHash) {
      console.log(`Skipping embedding generation for ${userId} - content unchanged`);
      return;
    }
    
    // Generate new embedding
    const embeddingResponse = await generateEmbeddings({
      input: content,
      model: "@cf/baai/bge-m3",
    });
    
    const embedding = embeddingResponse.embeddings[0];
    
    // Upsert embedding
    if (existingEmbedding.length > 0) {
      // Update existing
      await db
        .update(profileEmbeddings)
        .set({
          embedding,
          contentHash,
          contentPreview: content.slice(0, 500), // First 500 chars for preview
          updatedAt: new Date(),
        })
        .where(eq(profileEmbeddings.userId, userId));
    } else {
      // Insert new
      await db.insert(profileEmbeddings).values({
        userId,
        embedding,
        contentHash,
        contentPreview: content.slice(0, 500),
        embeddingModel: "@cf/baai/bge-m3",
      });
    }
    
    // Log success
    const processingTimeMs = Date.now() - startTime;
    await db.insert(embeddingLogs).values({
      entityType: "profile",
      entityId: userId,
      action: existingEmbedding.length > 0 ? "updated" : "created",
      contentHash,
      processingTimeMs,
    });
    
    console.log(`Generated embedding for profile ${userId} in ${processingTimeMs}ms`);
  } catch (error) {
    // Log error
    await db.insert(embeddingLogs).values({
      entityType: "profile",
      entityId: userId,
      action: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      processingTimeMs: Date.now() - startTime,
    });
    
    console.error(`Failed to generate embedding for profile ${userId}:`, error);
    throw error;
  }
}

/**
 * Generate or update embedding for a project
 */
export async function generateProjectEmbedding(projectId: string): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Fetch project with owner profile
    const projectData = await db
      .select({
        id: projects.id,
        userId: projects.userId,
        name: projects.name,
        oneliner: projects.oneliner,
        description: projects.description,
        url: projects.url,
        ownerDisplayName: profiles.displayName,
        ownerLocation: profiles.location,
      })
      .from(projects)
      .leftJoin(profiles, eq(projects.userId, profiles.userId))
      .where(eq(projects.id, projectId))
      .limit(1);
    
    if (projectData.length === 0) {
      throw new Error(`Project not found for projectId: ${projectId}`);
    }
    
    const project = projectData[0];
    
    // Generate content and hash
    const content = buildProjectEmbeddingContent(
      {
        id: project.id,
        userId: project.userId,
        name: project.name,
        oneliner: project.oneliner,
        description: project.description,
        url: project.url,
      },
      {
        displayName: project.ownerDisplayName,
        location: project.ownerLocation,
      }
    );
    const contentHash = calculateContentHash(content);
    
    // Check if embedding exists and if content has changed
    const existingEmbedding = await db
      .select({
        id: projectEmbeddings.id,
        contentHash: projectEmbeddings.contentHash,
      })
      .from(projectEmbeddings)
      .where(eq(projectEmbeddings.projectId, projectId))
      .limit(1);
    
    // Skip if content hasn't changed
    if (existingEmbedding.length > 0 && existingEmbedding[0].contentHash === contentHash) {
      console.log(`Skipping embedding generation for project ${projectId} - content unchanged`);
      return;
    }
    
    // Generate new embedding
    const embeddingResponse = await generateEmbeddings({
      input: content,
      model: "@cf/baai/bge-m3",
    });
    
    const embedding = embeddingResponse.embeddings[0];
    
    // Upsert embedding
    if (existingEmbedding.length > 0) {
      // Update existing
      await db
        .update(projectEmbeddings)
        .set({
          embedding,
          contentHash,
          contentPreview: content.slice(0, 500),
          updatedAt: new Date(),
        })
        .where(eq(projectEmbeddings.projectId, projectId));
    } else {
      // Insert new
      await db.insert(projectEmbeddings).values({
        projectId,
        userId: project.userId,
        embedding,
        contentHash,
        contentPreview: content.slice(0, 500),
        embeddingModel: "@cf/baai/bge-m3",
      });
    }
    
    // Log success
    const processingTimeMs = Date.now() - startTime;
    await db.insert(embeddingLogs).values({
      entityType: "project",
      entityId: projectId,
      action: existingEmbedding.length > 0 ? "updated" : "created",
      contentHash,
      processingTimeMs,
    });
    
    console.log(`Generated embedding for project ${projectId} in ${processingTimeMs}ms`);
  } catch (error) {
    // Log error
    await db.insert(embeddingLogs).values({
      entityType: "project",
      entityId: projectId,
      action: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      processingTimeMs: Date.now() - startTime,
    });
    
    console.error(`Failed to generate embedding for project ${projectId}:`, error);
    throw error;
  }
}

/**
 * Batch generate embeddings for all profiles
 * Useful for initial setup or bulk updates
 */
export async function generateAllProfileEmbeddings(): Promise<void> {
  const allProfiles = await db
    .select({ userId: profiles.userId })
    .from(profiles);
  
  console.log(`Generating embeddings for ${allProfiles.length} profiles...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const profile of allProfiles) {
    try {
      await generateProfileEmbedding(profile.userId);
      successCount++;
    } catch (error) {
      console.error(`Failed to generate embedding for ${profile.userId}:`, error);
      errorCount++;
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`Completed: ${successCount} successful, ${errorCount} errors`);
}

/**
 * Batch generate embeddings for all projects
 */
export async function generateAllProjectEmbeddings(): Promise<void> {
  const allProjects = await db
    .select({ id: projects.id })
    .from(projects);
  
  console.log(`Generating embeddings for ${allProjects.length} projects...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const project of allProjects) {
    try {
      await generateProjectEmbedding(project.id);
      successCount++;
    } catch (error) {
      console.error(`Failed to generate embedding for ${project.id}:`, error);
      errorCount++;
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`Completed: ${successCount} successful, ${errorCount} errors`);
}