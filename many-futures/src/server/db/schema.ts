/**
 * Many Futures Database Schema
 * 
 * Complete Drizzle ORM schema definition for all 16 tables
 * Based on production requirements with expert feedback incorporated
 * 
 * @see /docs/02 Areas/Product-Specification/database-implementation/schema-with-rationale.md
 */

import { sql } from "drizzle-orm";
import {
	boolean,
	decimal,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTableCreator,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Multi-project schema - all tables prefixed with "many-futures_"
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `many-futures_${name}`);

// ============================================
// ENUMS
// ============================================

export const organizationTypeEnum = pgEnum("organization_type", ["PERSONAL", "TEAM"]);
export const subscriptionTierEnum = pgEnum("subscription_tier", ["TRIAL", "STARTER", "GROWTH", "ENTERPRISE"]);
export const projectStatusEnum = pgEnum("project_status", ["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]);
export const episodeStatusEnum = pgEnum("episode_status", ["DRAFT", "GENERATING", "PUBLISHED", "FAILED"]);
export const queueStatusEnum = pgEnum("queue_status", ["pending", "processing", "completed", "failed"]);
export const roleEnum = pgEnum("role", ["OWNER", "ADMIN", "MEMBER"]);
export const planningNoteStatusEnum = pgEnum("planning_note_status", ["pending", "processing", "incorporated", "dismissed"]);
export const planningNoteScopeEnum = pgEnum("planning_note_scope", ["NEXT_EPISODE", "FUTURE", "GENERAL"]);
export const blockTypeEnum = pgEnum("block_type", ["MARKDOWN", "INSIGHT", "SIGNAL", "SCENARIO"]);
export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant", "system"]);

// ============================================
// CORE TABLES
// ============================================

/**
 * Organizations - Foundation for all data
 * Every user belongs to at least one organization (personal workspace)
 */
export const organizations = createTable(
	"organization",
	{
		id: uuid().primaryKey().defaultRandom(),
		name: varchar({ length: 255 }).notNull(),
		type: organizationTypeEnum().notNull().default("PERSONAL"),
		ownerId: uuid("owner_id").notNull(),
		clerkOrgId: varchar("clerk_org_id", { length: 255 }),
		
		// Billing & Limits
		subscriptionTier: subscriptionTierEnum().default("TRIAL"),
		dailyCostLimit: decimal("daily_cost_limit", { precision: 10, scale: 2 }).default("50.00"),
		episodeCostLimit: decimal("episode_cost_limit", { precision: 10, scale: 2 }).default("3.00"),
		
		// Soft delete
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		deletedBy: uuid("deleted_by"),
		
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		index("idx_organizations_owner").on(t.ownerId),
		index("idx_organizations_clerk").on(t.clerkOrgId),
	]
);

/**
 * Users - Minimal data, auth handled by Clerk
 */
export const users = createTable(
	"user",
	{
		id: uuid().primaryKey().defaultRandom(),
		clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
		email: varchar({ length: 255 }).notNull(),
		name: varchar({ length: 255 }).notNull(),
		timezone: varchar({ length: 100 }).default("Europe/London"),
		
		// Preferences
		defaultOrganizationId: uuid("default_organization_id"),
		notificationPreferences: jsonb("notification_preferences")
			.default({ episodeReady: true, generationFailed: false }),
		
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		index("idx_users_clerk").on(t.clerkId),
		index("idx_users_email").on(t.email),
	]
);

/**
 * Organization Members - Many-to-many relationship
 */
export const organizationMembers = createTable(
	"organization_member",
	{
		id: uuid().primaryKey().defaultRandom(),
		organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
		userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
		role: roleEnum().notNull().default("MEMBER"),
		
		// Soft delete
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		deletedBy: uuid("deleted_by").references(() => users.id),
		
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		unique("unique_org_user").on(t.organizationId, t.userId),
		index("idx_org_members_org").on(t.organizationId),
		index("idx_org_members_user").on(t.userId),
	]
);

/**
 * Projects - Core entity for episode generation
 */
export const projects = createTable(
	"project",
	{
		id: uuid().primaryKey().defaultRandom(),
		organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
		userId: uuid("user_id").notNull().references(() => users.id),
		
		// Core content
		title: varchar({ length: 255 }).notNull(),
		onboardingBrief: jsonb("onboarding_brief").notNull(),
		
		// Scheduling (subscription model)
		cadenceConfig: jsonb("cadence_config")
			.notNull()
			.default({ mode: "weekly", days: [1], deliveryHour: 9 }),
		
		// Memory system (backend ready, no UI in MVP)
		memories: jsonb().default([]),
		
		// Status
		status: projectStatusEnum().default("ACTIVE"),
		isPaused: boolean("is_paused").default(false),
		nextScheduledAt: timestamp("next_scheduled_at", { withTimezone: true }),
		
		// Soft delete
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		deletedBy: uuid("deleted_by").references(() => users.id),
		
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		index("idx_projects_org").on(t.organizationId),
		index("idx_projects_user").on(t.userId),
		index("idx_projects_status").on(t.status),
	]
);

// ============================================
// CONTENT TABLES
// ============================================

/**
 * Episodes - Generated content for projects
 */
export const episodes = createTable(
	"episode",
	{
		id: uuid().primaryKey().defaultRandom(),
		projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
		
		// Content
		title: varchar({ length: 500 }),
		content: text(),
		sources: jsonb().default([]),
		
		// Status
		status: episodeStatusEnum().default("DRAFT").notNull(),
		
		// Timing (clarified fields)
		scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(), // When user expects episode (9am)
		generationStartedAt: timestamp("generation_started_at", { withTimezone: true }), // When generation began (5am)
		publishedAt: timestamp("published_at", { withTimezone: true }), // When content was ready
		deliveredAt: timestamp("delivered_at", { withTimezone: true }), // When email was sent
		
		// Generation tracking
		generationAttempts: integer("generation_attempts").default(0),
		generationErrors: jsonb("generation_errors").default([]),
		idempotencyKey: varchar("idempotency_key", { length: 255 }),
		
		// Metadata
		episodeNumber: integer("episode_number"),
		readingMinutes: integer("reading_minutes"),
		
		// Soft delete
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		deletedBy: uuid("deleted_by").references(() => users.id),
		
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		unique("unique_episode_schedule").on(t.projectId, t.idempotencyKey),
		index("idx_episodes_project").on(t.projectId),
		index("idx_episodes_org").on(t.organizationId),
		index("idx_episodes_scheduled").on(t.scheduledFor),
		index("idx_episodes_generation_due").on(t.scheduledFor, t.status).where(sql`${t.status} = 'DRAFT'`),
	]
);

/**
 * Episode Schedule Queue - Critical for production resilience
 */
export const episodeScheduleQueue = createTable(
	"episode_schedule_queue",
	{
		id: uuid().primaryKey().defaultRandom(),
		episodeId: uuid("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
		
		// Timing (clarified)
		generationStartTime: timestamp("generation_start_time", { withTimezone: true }).notNull(), // START generation (5am)
		targetDeliveryTime: timestamp("target_delivery_time", { withTimezone: true }).notNull(), // User expects (9am)
		
		// Status
		status: queueStatusEnum().default("pending").notNull(),
		priority: integer().default(5), // 10=Premium, 8=Retry, 5=Standard
		
		// Processing
		lockedAt: timestamp("locked_at", { withTimezone: true }),
		lockedBy: varchar("locked_by", { length: 255 }),
		attemptCount: integer("attempt_count").default(0),
		maxAttempts: integer("max_attempts").default(3),
		
		// Results
		completedAt: timestamp("completed_at", { withTimezone: true }),
		errorMessage: text("error_message"),
		result: jsonb(),
		
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		unique("unique_queue_entry").on(t.episodeId, t.status),
		index("idx_queue_processing").on(t.generationStartTime, t.status, t.priority)
			.where(sql`${t.status} = 'pending'`),
		index("idx_queue_episode").on(t.episodeId),
	]
);

/**
 * Blocks - Content structure (start with Markdown for MVP)
 */
export const blocks = createTable(
	"block",
	{
		id: uuid().primaryKey().defaultRandom(),
		episodeId: uuid("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
		
		// Content
		type: blockTypeEnum().default("MARKDOWN").notNull(),
		content: text().notNull(),
		position: integer().notNull(),
		
		// Metadata (not JSON for querying)
		title: varchar({ length: 500 }),
		sourceUrls: text("source_urls").array(),
		confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
		
		// Soft delete
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		deletedBy: uuid("deleted_by").references(() => users.id),
		
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		index("idx_blocks_episode").on(t.episodeId),
		index("idx_blocks_position").on(t.episodeId, t.position),
	]
);

// ============================================
// OPERATIONAL TABLES
// ============================================

/**
 * Token Usage - Track every API call for cost control
 */
export const tokenUsage = createTable(
	"token_usage",
	{
		id: uuid().primaryKey().defaultRandom(),
		organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
		episodeId: uuid("episode_id").references(() => episodes.id, { onDelete: "set null" }),
		
		// Usage details
		model: varchar({ length: 100 }).notNull(),
		operation: varchar({ length: 100 }),
		promptTokens: integer("prompt_tokens").notNull(),
		completionTokens: integer("completion_tokens").notNull(),
		totalTokens: integer("total_tokens"),
		totalCost: decimal("total_cost", { precision: 10, scale: 4 }).notNull(),
		
		// Context
		userId: uuid("user_id").references(() => users.id),
		metadata: jsonb(),
		
		// Timestamp
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("idx_token_usage_org").on(t.organizationId),
		index("idx_token_usage_episode").on(t.episodeId),
		index("idx_token_usage_created").on(t.createdAt),
	]
);

/**
 * Token Usage Daily - Aggregated for performance
 */
export const tokenUsageDaily = createTable(
	"token_usage_daily",
	{
		id: uuid().primaryKey().defaultRandom(),
		organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
		date: timestamp({ withTimezone: true, mode: "date" }).notNull(),
		
		// Aggregates
		totalTokens: integer("total_tokens").default(0),
		totalCostGbp: decimal("total_cost_gbp", { precision: 10, scale: 2 }).default("0"),
		
		// Breakdown by operation
		generationTokens: integer("generation_tokens").default(0),
		generationCostGbp: decimal("generation_cost_gbp", { precision: 10, scale: 2 }).default("0"),
		chatTokens: integer("chat_tokens").default(0),
		chatCostGbp: decimal("chat_cost_gbp", { precision: 10, scale: 2 }).default("0"),
		
		// Metadata
		episodeCount: integer("episode_count").default(0),
		lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
	},
	(t) => [
		unique("unique_org_date").on(t.organizationId, t.date),
		index("idx_token_daily_lookup").on(t.organizationId, t.date),
	]
);

/**
 * Planning Notes - User feedback loop (Priority 1!)
 */
export const planningNotes = createTable(
	"planning_note",
	{
		id: uuid().primaryKey().defaultRandom(),
		projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
		userId: uuid("user_id").notNull().references(() => users.id),
		episodeId: uuid("episode_id").references(() => episodes.id, { onDelete: "set null" }),
		
		// Content
		note: text().notNull(),
		noteType: varchar("note_type", { length: 50 }).default("GENERAL"),
		
		// Processing
		status: planningNoteStatusEnum().default("pending"),
		priority: integer().default(5),
		scope: planningNoteScopeEnum().default("NEXT_EPISODE"),
		
		// Results
		processedAt: timestamp("processed_at", { withTimezone: true }),
		processedBy: varchar("processed_by", { length: 100 }),
		impactSummary: text("impact_summary"),
		
		// Soft delete
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		deletedBy: uuid("deleted_by").references(() => users.id),
		
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		index("idx_planning_notes_project").on(t.projectId),
		index("idx_planning_notes_org").on(t.organizationId),
		index("idx_planning_notes_status").on(t.status),
	]
);

/**
 * User Events - Flexible event tracking
 */
export const userEvents = createTable(
	"user_event",
	{
		id: uuid().primaryKey().defaultRandom(),
		userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
		organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
		
		// Event details
		eventType: varchar("event_type", { length: 100 }).notNull(), // 'episode_opened', 'feedback_submitted', etc.
		eventData: jsonb("event_data"), // Flexible data storage
		
		// Context
		sessionId: varchar("session_id", { length: 255 }),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		
		// Timestamp
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("idx_user_events_user").on(t.userId, t.eventType),
		index("idx_user_events_org").on(t.organizationId),
		index("idx_user_events_type").on(t.eventType),
	]
);

/**
 * Audit Log - Compliance and debugging
 */
export const auditLog = createTable(
	"audit_log",
	{
		id: uuid().primaryKey().defaultRandom(),
		organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
		userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
		
		// Audit details
		action: varchar({ length: 100 }).notNull(), // 'CREATE', 'UPDATE', 'DELETE', etc.
		resourceType: varchar("resource_type", { length: 100 }).notNull(),
		resourceId: uuid("resource_id"),
		
		// Changes
		oldValues: text("old_values"),
		newValues: text("new_values"),
		
		// Context
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		
		// Timestamp
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("idx_audit_resource").on(t.resourceType, t.resourceId),
		index("idx_audit_org").on(t.organizationId),
	]
);

// ============================================
// FUTURE FEATURES (Create now for stability)
// ============================================

/**
 * Agent Memory - Future memory system
 */
export const agentMemory = createTable(
	"agent_memory",
	{
		id: uuid().primaryKey().defaultRandom(),
		projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
		
		// Memory content
		content: text().notNull(),
		memoryType: varchar("memory_type", { length: 50 }).default("GENERAL"),
		importance: decimal({ precision: 3, scale: 2 }).default("0.5"),
		
		// Metadata
		source: varchar({ length: 100 }),
		sourceId: uuid("source_id"),
		expiresAt: timestamp("expires_at", { withTimezone: true }),
		
		// Soft delete
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		deletedBy: uuid("deleted_by").references(() => users.id),
		
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		index("idx_agent_memory_project").on(t.projectId),
		index("idx_agent_memory_expires").on(t.expiresAt),
	]
);

/**
 * Chat Sessions - Future chat feature
 */
export const chatSessions = createTable(
	"chat_session",
	{
		id: uuid().primaryKey().defaultRandom(),
		projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
		userId: uuid("user_id").notNull().references(() => users.id),
		episodeId: uuid("episode_id").references(() => episodes.id, { onDelete: "set null" }),
		
		// Session details
		title: varchar({ length: 255 }),
		contextEpisodes: uuid("context_episodes").array(),
		contextBlocks: uuid("context_blocks").array(),
		
		// Status
		isActive: boolean("is_active").default(true),
		
		// Metrics
		messageCount: integer("message_count").default(0),
		totalTokens: integer("total_tokens").default(0),
		totalCost: decimal("total_cost", { precision: 10, scale: 4 }).default("0"),
		
		// Soft delete
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		deletedBy: uuid("deleted_by").references(() => users.id),
		
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		index("idx_chat_sessions_project").on(t.projectId),
		index("idx_chat_sessions_user").on(t.userId),
	]
);

/**
 * Chat Messages - Chat history
 */
export const chatMessages = createTable(
	"chat_message",
	{
		id: uuid().primaryKey().defaultRandom(),
		sessionId: uuid("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
		
		// Message content
		role: chatRoleEnum().notNull(),
		content: text().notNull(),
		
		// Metadata
		tokensUsed: integer("tokens_used"),
		cost: decimal({ precision: 10, scale: 4 }),
		model: varchar({ length: 100 }),
		
		// Extracted data
		extractedInsights: jsonb("extracted_insights"),
		
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("idx_chat_messages_session").on(t.sessionId),
	]
);

/**
 * Highlights - Text selections and annotations
 */
export const highlights = createTable(
	"highlight",
	{
		id: uuid().primaryKey().defaultRandom(),
		userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
		episodeId: uuid("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }),
		blockId: uuid("block_id").references(() => blocks.id, { onDelete: "cascade" }),
		
		// Selection details
		selectedText: text("selected_text").notNull(),
		startOffset: integer("start_offset"),
		endOffset: integer("end_offset"),
		
		// User annotation
		note: text(),
		color: varchar({ length: 20 }).default("yellow"),
		
		// Chat reference
		chatSessionId: uuid("chat_session_id").references(() => chatSessions.id, { onDelete: "set null" }),
		
		// Soft delete
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		deletedBy: uuid("deleted_by").references(() => users.id),
		
		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		index("idx_highlights_user").on(t.userId),
		index("idx_highlights_episode").on(t.episodeId),
	]
);

// ============================================
// RELATIONS (for Drizzle's query API)
// ============================================

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
	owner: one(users, {
		fields: [organizations.ownerId],
		references: [users.id],
	}),
	members: many(organizationMembers),
	projects: many(projects),
	episodes: many(episodes),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
	ownedOrganizations: many(organizations),
	organizationMemberships: many(organizationMembers),
	projects: many(projects),
	defaultOrganization: one(organizations, {
		fields: [users.defaultOrganizationId],
		references: [organizations.id],
	}),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [projects.organizationId],
		references: [organizations.id],
	}),
	user: one(users, {
		fields: [projects.userId],
		references: [users.id],
	}),
	episodes: many(episodes),
	planningNotes: many(planningNotes),
	agentMemories: many(agentMemory),
	chatSessions: many(chatSessions),
}));

export const episodesRelations = relations(episodes, ({ one, many }) => ({
	project: one(projects, {
		fields: [episodes.projectId],
		references: [projects.id],
	}),
	organization: one(organizations, {
		fields: [episodes.organizationId],
		references: [organizations.id],
	}),
	blocks: many(blocks),
	queueEntry: one(episodeScheduleQueue),
	tokenUsage: many(tokenUsage),
	planningNotes: many(planningNotes),
	highlights: many(highlights),
}));

export const episodeScheduleQueueRelations = relations(episodeScheduleQueue, ({ one }) => ({
	episode: one(episodes, {
		fields: [episodeScheduleQueue.episodeId],
		references: [episodes.id],
	}),
	organization: one(organizations, {
		fields: [episodeScheduleQueue.organizationId],
		references: [organizations.id],
	}),
}));

export const blocksRelations = relations(blocks, ({ one, many }) => ({
	episode: one(episodes, {
		fields: [blocks.episodeId],
		references: [episodes.id],
	}),
	organization: one(organizations, {
		fields: [blocks.organizationId],
		references: [organizations.id],
	}),
	highlights: many(highlights),
}));

export const planningNotesRelations = relations(planningNotes, ({ one }) => ({
	project: one(projects, {
		fields: [planningNotes.projectId],
		references: [projects.id],
	}),
	organization: one(organizations, {
		fields: [planningNotes.organizationId],
		references: [organizations.id],
	}),
	user: one(users, {
		fields: [planningNotes.userId],
		references: [users.id],
	}),
	episode: one(episodes, {
		fields: [planningNotes.episodeId],
		references: [episodes.id],
	}),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
	project: one(projects, {
		fields: [chatSessions.projectId],
		references: [projects.id],
	}),
	organization: one(organizations, {
		fields: [chatSessions.organizationId],
		references: [organizations.id],
	}),
	user: one(users, {
		fields: [chatSessions.userId],
		references: [users.id],
	}),
	episode: one(episodes, {
		fields: [chatSessions.episodeId],
		references: [episodes.id],
	}),
	messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
	session: one(chatSessions, {
		fields: [chatMessages.sessionId],
		references: [chatSessions.id],
	}),
	organization: one(organizations, {
		fields: [chatMessages.organizationId],
		references: [organizations.id],
	}),
}));

export const tokenUsageRelations = relations(tokenUsage, ({ one }) => ({
	episode: one(episodes, {
		fields: [tokenUsage.episodeId],
		references: [episodes.id],
	}),
	organization: one(organizations, {
		fields: [tokenUsage.organizationId],
		references: [organizations.id],
	}),
	user: one(users, {
		fields: [tokenUsage.userId],
		references: [users.id],
	}),
}));

export const highlightsRelations = relations(highlights, ({ one }) => ({
	user: one(users, {
		fields: [highlights.userId],
		references: [users.id],
	}),
	organization: one(organizations, {
		fields: [highlights.organizationId],
		references: [organizations.id],
	}),
	episode: one(episodes, {
		fields: [highlights.episodeId],
		references: [episodes.id],
	}),
	block: one(blocks, {
		fields: [highlights.blockId],
		references: [blocks.id],
	}),
	chatSession: one(chatSessions, {
		fields: [highlights.chatSessionId],
		references: [chatSessions.id],
	}),
}));