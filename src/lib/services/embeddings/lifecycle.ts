import { generateProfileEmbedding, generateProjectEmbedding } from "./profile-embeddings";

/**
 * Embedding lifecycle management
 * Provides hooks to automatically update embeddings when data changes
 */

/**
 * Queue for processing embedding updates
 * In production, this could be replaced with a proper queue service
 */
const embeddingQueue: {
  type: "profile" | "project";
  id: string;
  timestamp: number;
}[] = [];

let isProcessing = false;

/**
 * Add an item to the embedding update queue
 */
function queueEmbeddingUpdate(type: "profile" | "project", id: string) {
  // Check if already in queue
  const exists = embeddingQueue.some(
    item => item.type === type && item.id === id
  );
  
  if (!exists) {
    embeddingQueue.push({
      type,
      id,
      timestamp: Date.now(),
    });
    
    // Start processing if not already running
    if (!isProcessing) {
      processQueue();
    }
  }
}

/**
 * Process the embedding queue
 */
async function processQueue() {
  if (isProcessing || embeddingQueue.length === 0) {
    return;
  }
  
  isProcessing = true;
  
  while (embeddingQueue.length > 0) {
    const item = embeddingQueue.shift();
    if (!item) continue;
    
    try {
      if (item.type === "profile") {
        await generateProfileEmbedding(item.id);
      } else if (item.type === "project") {
        await generateProjectEmbedding(item.id);
      }
    } catch (error) {
      console.error(`Failed to process embedding for ${item.type} ${item.id}:`, error);
      // Could implement retry logic here
    }
    
    // Small delay between processing to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  isProcessing = false;
}

/**
 * Hook to be called after a profile is created or updated
 * This should be integrated into your profile creation/update logic
 */
export async function onProfileChange(userId: string, isImmediate = false) {
  if (isImmediate) {
    // Process immediately (useful for initial creation)
    try {
      await generateProfileEmbedding(userId);
    } catch (error) {
      console.error(`Failed to generate embedding for profile ${userId}:`, error);
    }
  } else {
    // Queue for background processing
    queueEmbeddingUpdate("profile", userId);
  }
}

/**
 * Hook to be called after a project is created or updated
 */
export async function onProjectChange(projectId: string, isImmediate = false) {
  if (isImmediate) {
    // Process immediately
    try {
      await generateProjectEmbedding(projectId);
    } catch (error) {
      console.error(`Failed to generate embedding for project ${projectId}:`, error);
    }
  } else {
    // Queue for background processing
    queueEmbeddingUpdate("project", projectId);
  }
}

/**
 * Hook to be called when a project is deleted
 * Also triggers profile embedding update since projects affect profile content
 */
export async function onProjectDelete(userId: string) {
  // Update profile embedding since project list changed
  queueEmbeddingUpdate("profile", userId);
}

/**
 * Middleware wrapper for profile operations
 * Use this to wrap your existing profile update/create functions
 */
export function withProfileEmbedding<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  getUserId: (args: Parameters<T>, result: Awaited<ReturnType<T>>) => string | undefined
): T {
  return (async (...args: Parameters<T>) => {
    const result = await fn(...args);
    
    const userId = getUserId(args, result);
    if (userId) {
      // Queue embedding update in background
      onProfileChange(userId, false);
    }
    
    return result;
  }) as T;
}

/**
 * Middleware wrapper for project operations
 */
export function withProjectEmbedding<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  getIds: (args: Parameters<T>, result: Awaited<ReturnType<T>>) => { projectId?: string; userId?: string }
): T {
  return (async (...args: Parameters<T>) => {
    const result = await fn(...args);
    
    const { projectId, userId } = getIds(args, result);
    
    if (projectId) {
      // Queue project embedding update
      onProjectChange(projectId, false);
    }
    
    if (userId) {
      // Also update profile embedding since projects affect profile content
      onProfileChange(userId, false);
    }
    
    return result;
  }) as T;
}

/**
 * Initialize embedding lifecycle management
 * Call this on app startup
 */
export function initializeEmbeddingLifecycle() {
  console.log("Embedding lifecycle management initialized");
  
  // Could set up periodic processing here if needed
  setInterval(() => {
    if (embeddingQueue.length > 0 && !isProcessing) {
      console.log(`Processing ${embeddingQueue.length} pending embedding updates`);
      processQueue();
    }
  }, 30000); // Check every 30 seconds
}