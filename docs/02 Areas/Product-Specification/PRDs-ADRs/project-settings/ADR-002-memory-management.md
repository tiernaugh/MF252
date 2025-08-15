# ADR-002: Project Memory Management

**Date:** 2025-08-15  
**Status:** Accepted  
**Context:** Project Settings Feature

## Context

Users need transparency and control over what the AI "remembers" about their preferences and interests. This affects episode relevance and builds trust. We need a memory system that:

1. Shows users what the system has learned
2. Allows correction/deletion of incorrect assumptions  
3. Scales from simple list to sophisticated memory system
4. Integrates with future AI agents (via Mem0 or similar)
5. Maintains user privacy and control

## Decision

We will implement a **transparent, user-controlled memory list** that:

1. **Displays memories as simple statements** in the settings page
2. **Allows individual deletion** of memories
3. **Provides bulk clear** functionality
4. **Stores memories with the project** (not globally)

### Data Structure

```typescript
interface Project {
  // ... other fields
  memories: ProjectMemory[];
}

interface ProjectMemory {
  id: string;
  content: string;           // The memory statement
  source: 'onboarding' | 'feedback' | 'interaction' | 'inferred';
  confidence?: number;        // 0-1 score (future)
  createdAt: Date;
  lastUsedAt?: Date;         // Track active usage
  metadata?: {
    episodeId?: string;       // If learned from specific episode
    feedbackId?: string;      // If learned from feedback
  };
}
```

### UI Pattern

```
Memories
These items are learned from your conversations and feedback

[✓] Interested in UK regulatory context                    [Delete]
[✓] Engages with contrarian perspectives                   [Delete]
[✓] Focus on strategic positioning over tool reviews       [Delete]
[✓] Prefers policy-focused analysis                        [Delete]

☑️ Allow Futura to remember new insights        [Clear all memories]
```

## Consequences

### Positive

1. **Trust building**: Users see exactly what system "knows"
2. **User control**: Can correct mistakes immediately
3. **Progressive enhancement**: Simple list can evolve to complex system
4. **Privacy-first**: Project-scoped, user-controlled
5. **AI improvement**: Memories directly improve episode relevance

### Negative

1. **Oversimplification**: Complex preferences reduced to short statements
2. **Management overhead**: Users may need to curate many memories
3. **Context loss**: Deleting memories might reduce quality
4. **Storage growth**: Could accumulate many memories over time

## Alternatives Considered

### Alternative 1: Global User Preferences
```typescript
userPreferences: {
  topics: string[];
  style: string[];
  avoid: string[];
}
```
- ✅ Simpler to implement
- ❌ Less flexible
- ❌ Applies to all projects (not always desired)
- ❌ Harder to trace source of preference

### Alternative 2: Hidden/Opaque Memory
No UI display, fully automated
- ✅ Less user management needed
- ❌ No transparency (trust issues)
- ❌ Can't correct mistakes
- ❌ "Black box" feeling

### Alternative 3: Weighted Tag System
```typescript
interests: Map<string, number>; // {"AI regulation": 0.8, "UK market": 0.9}
```
- ✅ More nuanced
- ❌ Complex UI needed
- ❌ Harder for users to understand
- ❌ Over-engineered for MVP

## Implementation Notes

### Phase 1 (MVP)
1. Simple string array in mock data
2. Pre-populated with example memories
3. Delete functionality (client-side only)
4. Toggle for accepting new memories (UI only)

### Phase 2 (Integration)
1. Connect to Mem0 or similar service
2. Auto-generate memories from feedback
3. Track memory usage in episode generation
4. Add confidence scores

### Phase 3 (Intelligence)
1. Memory clustering/deduplication
2. Temporal relevance (old memories fade)
3. Cross-project memory sharing (optional)
4. Memory explanation (why system learned this)

### Memory Sources

1. **Onboarding**: Initial conversation
   ```
   "Interested in AI impact on UK consultancies"
   "Focuses on 18-month planning horizon"
   ```

2. **Feedback**: Episode ratings
   ```
   "Prefers concrete examples over theory"
   "Values contrarian perspectives"
   ```

3. **Interactions**: Usage patterns
   ```
   "Reads episodes on Tuesdays"
   "Skips overly technical content"
   ```

4. **Inferred**: AI analysis
   ```
   "Interested in regulatory implications"
   "Responds well to scenario planning"
   ```

## Migration Strategy

### From MVP to Production

1. **Extract from onboarding brief**
   ```typescript
   function extractMemories(brief: OnboardingBrief): string[] {
     // Parse conversation for key statements
     // "I'm interested in X" → "Interested in X"
     // "We focus on Y" → "Focuses on Y"
   }
   ```

2. **Store in database**
   ```sql
   CREATE TABLE project_memories (
     id UUID PRIMARY KEY,
     project_id UUID REFERENCES projects(id),
     content TEXT NOT NULL,
     source VARCHAR(20),
     confidence FLOAT,
     created_at TIMESTAMP,
     last_used_at TIMESTAMP
   );
   ```

3. **Sync with AI service**
   ```typescript
   // When generating episodes
   const memories = await getProjectMemories(projectId);
   const context = memories.map(m => m.content).join('\n');
   ```

## Privacy & Security Considerations

1. **Project-scoped**: Memories never shared across organizations
2. **User-controlled**: Full CRUD capabilities
3. **No PII**: Memories should be preference statements, not personal data
4. **Audit trail**: Track all modifications
5. **Export capability**: Users can download their memories

## Future Enhancements

1. **Memory importance**: User can mark critical vs nice-to-have
2. **Memory sources**: Show where each memory came from
3. **Memory impact**: Show how memories affected recent episodes
4. **Shared memories**: Team projects could have shared preferences
5. **Memory templates**: Common patterns for different industries

## Success Metrics

- **Engagement**: % of users who interact with memories
- **Correction rate**: How often users delete/modify memories
- **Relevance improvement**: Episode rating correlation with memory count
- **Trust metrics**: User feedback on transparency

## References

- [Mem0 Documentation](https://docs.mem0.ai/)
- [GDPR Article 15: Right of Access](https://gdpr-info.eu/art-15-gdpr/)
- [UX Research: Transparency in AI](internal-link)