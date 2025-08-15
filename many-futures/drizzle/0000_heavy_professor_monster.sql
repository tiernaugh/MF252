CREATE TYPE "public"."block_type" AS ENUM('MARKDOWN', 'INSIGHT', 'SIGNAL', 'SCENARIO');--> statement-breakpoint
CREATE TYPE "public"."chat_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."episode_status" AS ENUM('DRAFT', 'GENERATING', 'PUBLISHED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."organization_type" AS ENUM('PERSONAL', 'TEAM');--> statement-breakpoint
CREATE TYPE "public"."planning_note_scope" AS ENUM('NEXT_EPISODE', 'FUTURE', 'GENERAL');--> statement-breakpoint
CREATE TYPE "public"."planning_note_status" AS ENUM('pending', 'processing', 'incorporated', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."queue_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('OWNER', 'ADMIN', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('TRIAL', 'STARTER', 'GROWTH', 'ENTERPRISE');--> statement-breakpoint
CREATE TABLE "many-futures_agent_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"content" text NOT NULL,
	"memory_type" varchar(50) DEFAULT 'GENERAL',
	"importance" numeric(3, 2) DEFAULT '0.5',
	"source" varchar(100),
	"source_id" uuid,
	"expires_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "many-futures_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" uuid,
	"old_values" text,
	"new_values" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "many-futures_block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"episode_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" "block_type" DEFAULT 'MARKDOWN' NOT NULL,
	"content" text NOT NULL,
	"position" integer NOT NULL,
	"title" varchar(500),
	"source_urls" text[],
	"confidence_score" numeric(3, 2),
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "many-futures_chat_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" "chat_role" NOT NULL,
	"content" text NOT NULL,
	"tokens_used" integer,
	"cost" numeric(10, 4),
	"model" varchar(100),
	"extracted_insights" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "many-futures_chat_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"episode_id" uuid,
	"title" varchar(255),
	"context_episodes" uuid[],
	"context_blocks" uuid[],
	"is_active" boolean DEFAULT true,
	"message_count" integer DEFAULT 0,
	"total_tokens" integer DEFAULT 0,
	"total_cost" numeric(10, 4) DEFAULT '0',
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "many-futures_episode_schedule_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"episode_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"generation_start_time" timestamp with time zone NOT NULL,
	"target_delivery_time" timestamp with time zone NOT NULL,
	"status" "queue_status" DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 5,
	"locked_at" timestamp with time zone,
	"locked_by" varchar(255),
	"attempt_count" integer DEFAULT 0,
	"max_attempts" integer DEFAULT 3,
	"completed_at" timestamp with time zone,
	"error_message" text,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_queue_entry" UNIQUE("episode_id","status")
);
--> statement-breakpoint
CREATE TABLE "many-futures_episode" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" varchar(500),
	"content" text,
	"sources" jsonb DEFAULT '[]'::jsonb,
	"status" "episode_status" DEFAULT 'DRAFT' NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"generation_started_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"generation_attempts" integer DEFAULT 0,
	"generation_errors" jsonb DEFAULT '[]'::jsonb,
	"idempotency_key" varchar(255),
	"episode_number" integer,
	"reading_minutes" integer,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_episode_schedule" UNIQUE("project_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "many-futures_highlight" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"episode_id" uuid NOT NULL,
	"block_id" uuid,
	"selected_text" text NOT NULL,
	"start_offset" integer,
	"end_offset" integer,
	"note" text,
	"color" varchar(20) DEFAULT 'yellow',
	"chat_session_id" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "many-futures_organization_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "role" DEFAULT 'MEMBER' NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_org_user" UNIQUE("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "many-futures_organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "organization_type" DEFAULT 'PERSONAL' NOT NULL,
	"owner_id" uuid NOT NULL,
	"clerk_org_id" varchar(255),
	"subscriptionTier" "subscription_tier" DEFAULT 'TRIAL',
	"daily_cost_limit" numeric(10, 2) DEFAULT '50.00',
	"episode_cost_limit" numeric(10, 2) DEFAULT '3.00',
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "many-futures_planning_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"episode_id" uuid,
	"note" text NOT NULL,
	"note_type" varchar(50) DEFAULT 'GENERAL',
	"status" "planning_note_status" DEFAULT 'pending',
	"priority" integer DEFAULT 5,
	"scope" "planning_note_scope" DEFAULT 'NEXT_EPISODE',
	"processed_at" timestamp with time zone,
	"processed_by" varchar(100),
	"impact_summary" text,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "many-futures_project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"onboarding_brief" jsonb NOT NULL,
	"cadence_config" jsonb DEFAULT '{"mode":"weekly","days":[1],"deliveryHour":9}'::jsonb NOT NULL,
	"memories" jsonb DEFAULT '[]'::jsonb,
	"status" "project_status" DEFAULT 'ACTIVE',
	"is_paused" boolean DEFAULT false,
	"next_scheduled_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "many-futures_token_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"episode_id" uuid,
	"model" varchar(100) NOT NULL,
	"operation" varchar(100),
	"prompt_tokens" integer NOT NULL,
	"completion_tokens" integer NOT NULL,
	"total_tokens" integer,
	"total_cost" numeric(10, 4) NOT NULL,
	"user_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "many-futures_token_usage_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"total_tokens" integer DEFAULT 0,
	"total_cost_gbp" numeric(10, 2) DEFAULT '0',
	"generation_tokens" integer DEFAULT 0,
	"generation_cost_gbp" numeric(10, 2) DEFAULT '0',
	"chat_tokens" integer DEFAULT 0,
	"chat_cost_gbp" numeric(10, 2) DEFAULT '0',
	"episode_count" integer DEFAULT 0,
	"last_updated" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_org_date" UNIQUE("organization_id","date")
);
--> statement-breakpoint
CREATE TABLE "many-futures_user_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"organization_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"event_data" jsonb,
	"session_id" varchar(255),
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "many-futures_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"timezone" varchar(100) DEFAULT 'Europe/London',
	"default_organization_id" uuid,
	"notification_preferences" jsonb DEFAULT '{"episodeReady":true,"generationFailed":false}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "many-futures_user_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "many-futures_agent_memory" ADD CONSTRAINT "many-futures_agent_memory_project_id_many-futures_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."many-futures_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_agent_memory" ADD CONSTRAINT "many-futures_agent_memory_organization_id_many-futures_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."many-futures_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_agent_memory" ADD CONSTRAINT "many-futures_agent_memory_deleted_by_many-futures_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."many-futures_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_audit_log" ADD CONSTRAINT "many-futures_audit_log_organization_id_many-futures_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."many-futures_organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_audit_log" ADD CONSTRAINT "many-futures_audit_log_user_id_many-futures_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."many-futures_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_block" ADD CONSTRAINT "many-futures_block_episode_id_many-futures_episode_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."many-futures_episode"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_block" ADD CONSTRAINT "many-futures_block_organization_id_many-futures_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."many-futures_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_block" ADD CONSTRAINT "many-futures_block_deleted_by_many-futures_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."many-futures_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_chat_message" ADD CONSTRAINT "many-futures_chat_message_session_id_many-futures_chat_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."many-futures_chat_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_chat_message" ADD CONSTRAINT "many-futures_chat_message_organization_id_many-futures_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."many-futures_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_chat_session" ADD CONSTRAINT "many-futures_chat_session_project_id_many-futures_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."many-futures_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_chat_session" ADD CONSTRAINT "many-futures_chat_session_organization_id_many-futures_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."many-futures_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_chat_session" ADD CONSTRAINT "many-futures_chat_session_user_id_many-futures_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."many-futures_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_chat_session" ADD CONSTRAINT "many-futures_chat_session_episode_id_many-futures_episode_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."many-futures_episode"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_chat_session" ADD CONSTRAINT "many-futures_chat_session_deleted_by_many-futures_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."many-futures_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_episode_schedule_queue" ADD CONSTRAINT "many-futures_episode_schedule_queue_episode_id_many-futures_episode_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."many-futures_episode"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_episode_schedule_queue" ADD CONSTRAINT "many-futures_episode_schedule_queue_organization_id_many-futures_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."many-futures_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_episode" ADD CONSTRAINT "many-futures_episode_project_id_many-futures_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."many-futures_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_episode" ADD CONSTRAINT "many-futures_episode_organization_id_many-futures_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."many-futures_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_episode" ADD CONSTRAINT "many-futures_episode_deleted_by_many-futures_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."many-futures_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_highlight" ADD CONSTRAINT "many-futures_highlight_user_id_many-futures_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."many-futures_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_highlight" ADD CONSTRAINT "many-futures_highlight_organization_id_many-futures_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."many-futures_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_highlight" ADD CONSTRAINT "many-futures_highlight_episode_id_many-futures_episode_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."many-futures_episode"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_highlight" ADD CONSTRAINT "many-futures_highlight_block_id_many-futures_block_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."many-futures_block"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_highlight" ADD CONSTRAINT "many-futures_highlight_chat_session_id_many-futures_chat_session_id_fk" FOREIGN KEY ("chat_session_id") REFERENCES "public"."many-futures_chat_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_highlight" ADD CONSTRAINT "many-futures_highlight_deleted_by_many-futures_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."many-futures_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_organization_member" ADD CONSTRAINT "many-futures_organization_member_organization_id_many-futures_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."many-futures_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_organization_member" ADD CONSTRAINT "many-futures_organization_member_user_id_many-futures_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."many-futures_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_organization_member" ADD CONSTRAINT "many-futures_organization_member_deleted_by_many-futures_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."many-futures_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_planning_note" ADD CONSTRAINT "many-futures_planning_note_project_id_many-futures_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."many-futures_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_planning_note" ADD CONSTRAINT "many-futures_planning_note_organization_id_many-futures_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."many-futures_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_planning_note" ADD CONSTRAINT "many-futures_planning_note_user_id_many-futures_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."many-futures_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_planning_note" ADD CONSTRAINT "many-futures_planning_note_episode_id_many-futures_episode_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."many-futures_episode"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_planning_note" ADD CONSTRAINT "many-futures_planning_note_deleted_by_many-futures_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."many-futures_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_project" ADD CONSTRAINT "many-futures_project_organization_id_many-futures_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."many-futures_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_project" ADD CONSTRAINT "many-futures_project_user_id_many-futures_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."many-futures_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_project" ADD CONSTRAINT "many-futures_project_deleted_by_many-futures_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."many-futures_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_token_usage" ADD CONSTRAINT "many-futures_token_usage_organization_id_many-futures_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."many-futures_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_token_usage" ADD CONSTRAINT "many-futures_token_usage_episode_id_many-futures_episode_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."many-futures_episode"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_token_usage" ADD CONSTRAINT "many-futures_token_usage_user_id_many-futures_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."many-futures_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_token_usage_daily" ADD CONSTRAINT "many-futures_token_usage_daily_organization_id_many-futures_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."many-futures_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_user_event" ADD CONSTRAINT "many-futures_user_event_user_id_many-futures_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."many-futures_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "many-futures_user_event" ADD CONSTRAINT "many-futures_user_event_organization_id_many-futures_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."many-futures_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agent_memory_project" ON "many-futures_agent_memory" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_agent_memory_expires" ON "many-futures_agent_memory" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_audit_resource" ON "many-futures_audit_log" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_audit_org" ON "many-futures_audit_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_blocks_episode" ON "many-futures_block" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_blocks_position" ON "many-futures_block" USING btree ("episode_id","position");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_session" ON "many-futures_chat_message" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_chat_sessions_project" ON "many-futures_chat_session" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_chat_sessions_user" ON "many-futures_chat_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_queue_processing" ON "many-futures_episode_schedule_queue" USING btree ("generation_start_time","status","priority") WHERE "many-futures_episode_schedule_queue"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "idx_queue_episode" ON "many-futures_episode_schedule_queue" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_episodes_project" ON "many-futures_episode" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_episodes_org" ON "many-futures_episode" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_episodes_scheduled" ON "many-futures_episode" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "idx_episodes_generation_due" ON "many-futures_episode" USING btree ("scheduled_for","status") WHERE "many-futures_episode"."status" = 'DRAFT';--> statement-breakpoint
CREATE INDEX "idx_highlights_user" ON "many-futures_highlight" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_highlights_episode" ON "many-futures_highlight" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_org_members_org" ON "many-futures_organization_member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_org_members_user" ON "many-futures_organization_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_organizations_owner" ON "many-futures_organization" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_organizations_clerk" ON "many-futures_organization" USING btree ("clerk_org_id");--> statement-breakpoint
CREATE INDEX "idx_planning_notes_project" ON "many-futures_planning_note" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_planning_notes_org" ON "many-futures_planning_note" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_planning_notes_status" ON "many-futures_planning_note" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_projects_org" ON "many-futures_project" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_projects_user" ON "many-futures_project" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "many-futures_project" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_token_usage_org" ON "many-futures_token_usage" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_token_usage_episode" ON "many-futures_token_usage" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_token_usage_created" ON "many-futures_token_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_token_daily_lookup" ON "many-futures_token_usage_daily" USING btree ("organization_id","date");--> statement-breakpoint
CREATE INDEX "idx_user_events_user" ON "many-futures_user_event" USING btree ("user_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_user_events_org" ON "many-futures_user_event" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_user_events_type" ON "many-futures_user_event" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_users_clerk" ON "many-futures_user" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "many-futures_user" USING btree ("email");