"use server";

import { db } from "~/server/db";
import * as schema from "~/server/db/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";
import type { Episode, EpisodeStatus, Source } from "~/lib/mock-data";

/**
 * Transform database episode to match mock data structure
 */
function transformEpisode(dbEpisode: any): Episode {
  // Get content from blocks if available, otherwise use content field
  let content = dbEpisode.content || "";
  if (dbEpisode.blocks && dbEpisode.blocks.length > 0) {
    // For MVP, we store all content in a single MARKDOWN block
    content = dbEpisode.blocks[0]?.content || "";
  }

  return {
    id: dbEpisode.id,
    projectId: dbEpisode.projectId,
    organizationId: dbEpisode.organizationId,
    sequence: dbEpisode.sequence || 1,
    title: dbEpisode.title || "Untitled Episode",
    summary: dbEpisode.summary || "Episode summary coming soon...",
    highlightQuote: dbEpisode.highlightQuote,
    content: content,
    sources: dbEpisode.sources || [],
    researchPrompt: dbEpisode.researchPrompt,
    status: dbEpisode.status as EpisodeStatus,
    publishedAt: dbEpisode.publishedAt ? new Date(dbEpisode.publishedAt) : null,
    readingMinutes: dbEpisode.readingMinutes || calculateReadingTime(content),
    createdAt: new Date(dbEpisode.createdAt),
    updatedAt: new Date(dbEpisode.updatedAt),
  };
}

/**
 * Calculate reading time from content
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * Get all episodes for a project
 */
export async function getEpisodesByProject(projectId: string): Promise<Episode[]> {
  try {
    const episodes = await db.query.episodes.findMany({
      where: eq(schema.episodes.projectId, projectId),
      orderBy: [desc(schema.episodes.publishedAt), desc(schema.episodes.createdAt)],
      with: {
        blocks: true, // Include blocks for content
      },
    });

    return episodes.map(transformEpisode);
  } catch (error) {
    console.error("Failed to get episodes:", error);
    throw new Error("Failed to load episodes");
  }
}

/**
 * Get a single episode by ID
 */
export async function getEpisodeById(id: string): Promise<Episode | null> {
  try {
    const episode = await db.query.episodes.findFirst({
      where: eq(schema.episodes.id, id),
      with: {
        blocks: {
          orderBy: [schema.blocks.position],
        },
        project: true,
      },
    });

    if (!episode) {
      return null;
    }

    return transformEpisode(episode);
  } catch (error) {
    console.error("Failed to get episode:", error);
    throw new Error("Failed to load episode");
  }
}

/**
 * Get latest episodes across all projects for an organization
 */
export async function getLatestEpisodes(
  orgId: string, 
  limit: number = 5
): Promise<Episode[]> {
  try {
    const episodes = await db.query.episodes.findMany({
      where: and(
        eq(schema.episodes.organizationId, orgId),
        eq(schema.episodes.status, "PUBLISHED"),
        isNotNull(schema.episodes.publishedAt)
      ),
      orderBy: [desc(schema.episodes.publishedAt)],
      limit: limit,
      with: {
        blocks: true,
        project: true,
      },
    });

    return episodes.map(transformEpisode);
  } catch (error) {
    console.error("Failed to get latest episodes:", error);
    throw new Error("Failed to load latest episodes");
  }
}

/**
 * Get episode with full context (project info, etc)
 */
export async function getEpisodeWithContext(id: string) {
  try {
    const episode = await db.query.episodes.findFirst({
      where: eq(schema.episodes.id, id),
      with: {
        blocks: {
          orderBy: [schema.blocks.position],
        },
        project: {
          with: {
            organization: true,
          },
        },
      },
    });

    if (!episode) {
      return null;
    }

    return {
      episode: transformEpisode(episode),
      project: episode.project,
      organization: episode.project.organization,
    };
  } catch (error) {
    console.error("Failed to get episode with context:", error);
    throw new Error("Failed to load episode");
  }
}

/**
 * Mark an episode as read (for future use)
 */
export async function markEpisodeRead(id: string, userId: string) {
  try {
    // For MVP, we'll just log this
    // In future, this will create a UserEvent record
    console.log(`User ${userId} read episode ${id}`);
    
    // Future implementation:
    // await db.insert(schema.userEvents).values({
    //   userId,
    //   organizationId: episode.organizationId,
    //   eventType: "episode_opened",
    //   eventData: { episodeId: id },
    // });
    
    return { success: true };
  } catch (error) {
    console.error("Failed to mark episode as read:", error);
    // Don't throw - this is not critical
    return { success: false };
  }
}

/**
 * Get episode count for a project
 */
export async function getEpisodeCount(projectId: string): Promise<number> {
  try {
    const episodes = await db
      .select({ count: schema.episodes.id })
      .from(schema.episodes)
      .where(
        and(
          eq(schema.episodes.projectId, projectId),
          eq(schema.episodes.status, "PUBLISHED")
        )
      );

    return episodes.length;
  } catch (error) {
    console.error("Failed to get episode count:", error);
    return 0;
  }
}