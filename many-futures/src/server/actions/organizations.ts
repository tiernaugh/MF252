"use server";

import { db } from "~/server/db";
import * as schema from "~/server/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get the current organization for the session
 * TODO: This will use Clerk's organization context once auth is implemented
 * For now, returns the test organization
 */
export async function getCurrentOrganization() {
  try {
    // Hardcoded for MVP - will use Clerk's auth.orgId later
    const org = await db.query.organizations.findFirst({
      where: eq(schema.organizations.name, "Test User's Workspace"),
    });

    if (!org) {
      throw new Error("Test organization not found. Please run seed script.");
    }

    return org;
  } catch (error) {
    console.error("Failed to get current organization:", error);
    throw new Error("Failed to load organization");
  }
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(id: string) {
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(schema.organizations.id, id),
    });

    if (!org) {
      throw new Error(`Organization ${id} not found`);
    }

    return org;
  } catch (error) {
    console.error("Failed to get organization by ID:", error);
    throw new Error("Failed to load organization");
  }
}

/**
 * Get the current user for the session
 * TODO: This will use Clerk's user context once auth is implemented
 * For now, returns the test user
 */
export async function getCurrentUser() {
  try {
    // Hardcoded for MVP - will use Clerk's auth.userId later
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, "test@manyfutures.ai"),
    });

    if (!user) {
      throw new Error("Test user not found. Please run seed script.");
    }

    return user;
  } catch (error) {
    console.error("Failed to get current user:", error);
    throw new Error("Failed to load user");
  }
}