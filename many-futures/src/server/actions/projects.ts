"use server";

import { db } from "~/server/db";
import * as schema from "~/server/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { Project, CadenceConfig } from "~/lib/mock-data";

/**
 * Transform database project to match mock data structure
 */
function transformProject(dbProject: any): Project {
  return {
    id: dbProject.id,
    organizationId: dbProject.organizationId,
    title: dbProject.title || "Untitled Project",
    description: dbProject.onboardingBrief?.description || 
                 dbProject.onboardingBrief?.conversation?.[0]?.content || 
                 "No description available",
    shortSummary: dbProject.onboardingBrief?.summary || 
                  `Exploring ${dbProject.title || "future trends"}`,
    onboardingBrief: dbProject.onboardingBrief,
    cadenceType: "WEEKLY" as const, // Legacy field
    cadenceConfig: dbProject.cadenceConfig || {
      mode: "weekly" as const,
      days: [1, 4], // Default to Monday & Thursday
    },
    nextScheduledAt: dbProject.nextScheduledAt,
    lastPublishedAt: dbProject.lastPublishedAt,
    isPaused: dbProject.status === "PAUSED",
    createdAt: new Date(dbProject.createdAt),
    updatedAt: new Date(dbProject.updatedAt),
  };
}

/**
 * Get all projects for an organization
 */
export async function getProjectsByOrg(orgId: string): Promise<Project[]> {
  try {
    const projects = await db.query.projects.findMany({
      where: eq(schema.projects.organizationId, orgId),
      orderBy: [desc(schema.projects.updatedAt)],
    });

    return projects.map(transformProject);
  } catch (error) {
    console.error("Failed to get projects:", error);
    throw new Error("Failed to load projects");
  }
}

/**
 * Get a single project by ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(schema.projects.id, id),
    });

    if (!project) {
      return null;
    }

    return transformProject(project);
  } catch (error) {
    console.error("Failed to get project:", error);
    throw new Error("Failed to load project");
  }
}

/**
 * Create a new project
 */
export async function createProject(data: {
  organizationId: string;
  userId: string;
  title: string;
  onboardingBrief: any;
  cadenceConfig?: CadenceConfig;
}) {
  try {
    const [project] = await db
      .insert(schema.projects)
      .values({
        organizationId: data.organizationId,
        userId: data.userId,
        title: data.title,
        onboardingBrief: data.onboardingBrief,
        cadenceConfig: data.cadenceConfig || {
          mode: "weekly",
          days: [1, 4],
          deliveryHour: 9,
        },
        status: "ACTIVE",
        nextScheduledAt: getNextScheduledDate(data.cadenceConfig),
      })
      .returning();

    revalidatePath("/projects");
    return transformProject(project);
  } catch (error) {
    console.error("Failed to create project:", error);
    throw new Error("Failed to create project");
  }
}

/**
 * Update project settings
 */
export async function updateProjectSettings(
  id: string,
  settings: {
    title?: string;
    cadenceConfig?: CadenceConfig;
    status?: "ACTIVE" | "PAUSED";
  }
) {
  try {
    const updateData: any = {};
    
    if (settings.title !== undefined) {
      updateData.title = settings.title;
    }
    
    if (settings.cadenceConfig !== undefined) {
      updateData.cadenceConfig = settings.cadenceConfig;
      // Recalculate next scheduled date if schedule changed
      if (settings.status !== "PAUSED") {
        updateData.nextScheduledAt = getNextScheduledDate(settings.cadenceConfig);
      }
    }
    
    if (settings.status !== undefined) {
      updateData.status = settings.status;
      if (settings.status === "PAUSED") {
        updateData.nextScheduledAt = null;
      } else if (!updateData.nextScheduledAt) {
        // Resuming - calculate next date
        const project = await getProjectById(id);
        updateData.nextScheduledAt = getNextScheduledDate(
          settings.cadenceConfig || project?.cadenceConfig
        );
      }
    }

    const [updated] = await db
      .update(schema.projects)
      .set(updateData)
      .where(eq(schema.projects.id, id))
      .returning();

    revalidatePath(`/projects/${id}`);
    revalidatePath(`/projects/${id}/settings`);
    revalidatePath("/projects");
    
    return transformProject(updated);
  } catch (error) {
    console.error("Failed to update project settings:", error);
    throw new Error("Failed to update settings");
  }
}

/**
 * Pause a project
 */
export async function pauseProject(id: string) {
  return updateProjectSettings(id, { status: "PAUSED" });
}

/**
 * Resume a project
 */
export async function resumeProject(id: string) {
  return updateProjectSettings(id, { status: "ACTIVE" });
}

/**
 * Calculate next scheduled date based on cadence config
 */
function getNextScheduledDate(cadenceConfig?: CadenceConfig): Date {
  const now = new Date();
  const config = cadenceConfig || { mode: "weekly", days: [1, 4] };
  
  // For MVP, just add days based on mode
  switch (config.mode) {
    case "daily":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "weekly":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "weekdays":
      // Skip to next weekday
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const day = tomorrow.getDay();
      if (day === 0) { // Sunday -> Monday
        return new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
      } else if (day === 6) { // Saturday -> Monday
        return new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000);
      }
      return tomorrow;
    case "custom":
      // Find next day in the days array
      const currentDay = now.getDay();
      const sortedDays = [...(config.days || [1, 4])].sort();
      
      // Find next day after current
      const nextDay = sortedDays.find(d => d > currentDay) ?? sortedDays[0] ?? 1;
      const daysToAdd = nextDay > currentDay 
        ? nextDay - currentDay 
        : 7 - currentDay + nextDay;
      
      return new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
}