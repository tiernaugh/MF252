# Expert Review Response: Database Schema Hardening

**Date:** 2025-01-11  
**Status:** Action Required  
**Context:** Expert panel review of our database schema revealed critical gaps

---

## Executive Summary

Four domain experts reviewed our schema and identified critical issues that must be addressed before production. While our architectural foundation is sound, we need immediate hardening in security, observability, and performance.

## Priority 1: Security (Must Fix Before Any User Data)

### Issue: No Database-Level Security
**Expert Concern:** "Application-only security is essentially no security"

**Our Response & Action Items:**
```sql
-- 1. Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 2. Create org-scoped policies
CREATE POLICY "Users can only see their org's projects" ON projects
  FOR ALL USING (organization_id = current_setting('app.current_org_id')::uuid);

-- 3. Add audit logging table
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY DEFAULT cuid(),
  user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'CREATE', 'READ', 'UPDATE', 'DELETE'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Issue: Unencrypted Sensitive Data
**Expert Concern:** ChatMessages and PlanningNotes contain strategic information

**Our Response:**
- Implement field-level encryption for `ChatMessage.content` and `PlanningNote.note`
- Use Prisma's encryption middleware or Supabase's Vault
- Add `encrypted_fields` config table for key rotation

### Issue: No Soft Deletes
**Expert Concern:** GDPR compliance impossible without soft deletes

**Our Response - Add to ALL tables:**
```prisma
deletedAt DateTime? @map("deleted_at")
deletedBy String? @map("deleted_by")
```

## Priority 2: AI System Observability

### Issue: No Metadata Versioning
**Expert Concern:** "Metadata schemas evolve weekly"

**Our Response - Enhanced Block model:**
```prisma
model Block {
  // ... existing fields ...
  
  // AI Generation Metadata
  metadataVersion      Int      @default(1) @map("metadata_version")
  generationMetadata   Json?    @map("generation_metadata")
  // { model: "claude-3.5", temperature: 0.7, promptVersion: "v1.2" }
  
  tokenCount          Int?     @map("token_count")
}
```

### Issue: Token Accounting Missing
**Expert Concern:** "Token accounting needs to be first-class"

**New Table:**
```prisma
model TokenUsage {
  id              String   @id @default(cuid())
  projectId       String   @map("project_id")
  userId          String   @map("user_id")
  usageType       String   // 'episode_generation', 'chat_response'
  inputTokens     Int      @map("input_tokens")
  outputTokens    Int      @map("output_tokens")
  modelUsed       String   @map("model_used")
  costUsd         Decimal  @map("cost_usd")
  createdAt       DateTime @default(now()) @map("created_at")
  
  @@index([projectId, createdAt])
  @@map("token_usage")
}
```

### Issue: No Feedback Loop Tracking
**Expert Concern:** Missing linkage between chat insights and editorial improvements

**New Table:**
```prisma
model DerivedInsight {
  id              String   @id @default(cuid())
  sessionId       String   @map("session_id")
  projectId       String   @map("project_id")
  insightType     String   @map("insight_type") // 'topic_interest', 'confusion_point'
  insightValue    Json     @map("insight_value")
  appliedToEpisodeId String? @map("applied_to_episode_id")
  createdAt       DateTime @default(now()) @map("created_at")
  
  @@index([projectId])
  @@map("derived_insights")
}
```

## Priority 3: User Behavior Tracking

### Issue: Boolean Flags Too Coarse
**Expert Concern:** "Understanding gradients of engagement is critical"

**Enhanced UserJourney:**
```prisma
model UserJourney {
  // ... existing booleans ...
  
  // Engagement Metrics
  totalHighlights        Int @default(0) @map("total_highlights")
  totalChatMessages      Int @default(0) @map("total_chat_messages")
  avgReadDepthPercent    Int @default(0) @map("avg_read_depth_percent")
  avgHighlightsPerEpisode Decimal? @map("avg_highlights_per_episode")
}
```

### Issue: No Implicit Feedback
**Expert Concern:** "Flying blind on user behavior"

**New Table:**
```prisma
model EngagementEvent {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  episodeId   String   @map("episode_id")
  eventType   String   // 'episode_opened', 'scroll_depth', 'time_on_block'
  eventValue  Json     // { depth: 75, blockId: "...", duration: 45 }
  createdAt   DateTime @default(now()) @map("created_at")
  
  @@index([userId, episodeId])
  @@index([eventType, createdAt])
  @@map("engagement_events")
}
```

## Priority 4: Performance Optimizations

### Issue: Missing Composite Indexes
**Expert Concern:** "You're missing critical indexes"

**Add These Indexes:**
```sql
-- Common query patterns
CREATE INDEX idx_episodes_project_status_published 
  ON episodes(project_id, status, published_at DESC);

CREATE INDEX idx_highlights_user_episode 
  ON highlights(user_id, episode_id, created_at DESC);

CREATE INDEX idx_blocks_episode_position 
  ON blocks(episode_id, position);

-- JSON indexes for frequent queries
CREATE INDEX idx_blocks_citations 
  ON blocks USING GIN ((research_citations));
```

### Issue: No Counter Caches
**Expert Concern:** "You'll need this for UI and throttling"

**Add to Episode model:**
```prisma
highlightCount    Int @default(0) @map("highlight_count")
chatMessageCount  Int @default(0) @map("chat_message_count")
```

## Implementation Plan

### Phase 0: Security (Before ANY user data)
- [ ] Implement RLS policies
- [ ] Add audit logging
- [ ] Set up encryption
- [ ] Add soft deletes

### Phase 1: Core Observability (Week 1)
- [ ] Add token tracking
- [ ] Add metadata versioning
- [ ] Add engagement events
- [ ] Set up monitoring dashboards

### Phase 2: Performance (Week 2)
- [ ] Add missing indexes
- [ ] Add counter caches
- [ ] Run EXPLAIN ANALYZE on top queries
- [ ] Set up query performance monitoring

### Phase 3: Advanced Features (Post-MVP)
- [ ] A/B testing infrastructure
- [ ] Advanced behavioral analytics
- [ ] Recommendation signals
- [ ] Feedback loop automation

## Expert Validation Checklist

- [ ] Run security audit with penetration testing
- [ ] Load test with 10k users, 100k episodes
- [ ] Verify GDPR compliance with legal
- [ ] Test token accounting accuracy
- [ ] Validate RLS policies can't be bypassed
- [ ] Confirm encryption key rotation works
- [ ] Measure baseline query performance

## Conclusion

The experts identified critical gaps that could cause major issues at scale. However, these are solvable with proper implementation. The security concerns are most critical and must be addressed before any user data enters the system.

Our Two-Loop Architecture remains sound, but needs better instrumentation to actually learn from user behavior. The schema is a good foundation that needs production hardening.

**Bottom Line:** Add security and observability first, then optimize performance based on real usage patterns.