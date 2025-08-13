# ADR: Learning & Personalization Strategy (Confidence-Weighted)

Status: **Deferred (Post-MVP)** · Owner: Product · Last Updated: 2025-01-16

<!-- MVP Note: We intentionally defer confidence-weighted learning. See PRD and Site Architecture ADR for the MVP memory transparency approach using Mem0 items with user controls. -->

**Note: This ADR documents a comprehensive learning approach that has been deferred for MVP. For MVP, we use simple memory transparency (ChatGPT pattern) with Mem0 items displayed as natural language with delete controls.**

## Decision

Implement a confidence-weighted observation system that learns from user behavior without becoming rigid or overconfident. Personalization influences content selection and framing, never content quality.

## Core Principles

1. **Quality First, Personalization Second** 
   - Editorial standards are never compromised for personalization
   - Strategic intelligence must challenge assumptions, not confirm biases
   - Personalization affects relevance and framing, not analytical rigor

2. **Confidence-Weighted Learning** 
   - All observations have confidence scores (0.0-1.0)
   - Confidence decays over time without reinforcement
   - Different evidence types have different weight thresholds

3. **Flexible Property Evolution** (Notion pattern)
   - Properties emerge organically from observations
   - No rigid schemas that lock in early assumptions
   - System can forget properties that aren't reinforced

## Data Architecture

### Observation Layer
```sql
user_observations (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  user_id uuid REFERENCES users(id),
  observation_type text, -- "content_engagement", "explicit_feedback", "conversation_pattern"
  signal_name text, -- "high_contrarian_engagement", "prefers_strategic_focus"
  strength float CHECK (strength >= 0 AND strength <= 1),
  evidence jsonb, -- Specific actions/content that led to this
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz -- Observations can expire
)
```

### Insight Layer (Derived)
```sql
user_insights (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  insight_type text, -- "content_preference", "strategic_interest", "communication_style"  
  insight_content jsonb,
  confidence_level float CHECK (confidence_level >= 0 AND confidence_level <= 1),
  supporting_observations uuid[], -- Links to evidence
  last_reinforced timestamptz,
  needs_validation boolean DEFAULT false
)
```

## Confidence Calculation

```typescript
interface ObservationWeight {
  explicit_feedback: 0.9,      // User directly stated preference
  conversation_pattern: 0.7,    // Consistent patterns in chat
  content_engagement: 0.5,      // Implicit signals from reading
  single_interaction: 0.3       // One-off engagement
}

function calculateConfidence(observations: Observation[]): number {
  const weightedSum = observations.reduce((sum, obs) => {
    const recencyFactor = calculateRecencyWeight(obs.created_at);
    return sum + (obs.strength * obs.weight * recencyFactor);
  }, 0);
  
  const sampleSizeFactor = Math.min(observations.length / 10, 1); // Cap at 10 observations
  return weightedSum * sampleSizeFactor;
}
```

## Memory Decay

- **Strong signals (confidence > 0.8)**: Decay after 30 days without reinforcement
- **Moderate signals (0.5-0.8)**: Decay after 14 days
- **Weak signals (< 0.5)**: Decay after 7 days
- **Explicit feedback**: Never decays (but confidence can be updated)

## UI Principles

### Language Patterns
- ❌ "You prefer contrarian perspectives"
- ✅ "Futura has noticed you engage with contrarian perspectives"
- ✅ "Based on recent episodes, you seem interested in..."
- ✅ "Futura thinks you might be interested in..." (with confidence indicator)

### Confidence Visualization
- 🟢 High confidence (> 0.8): Solid indicators, clear language
- 🟡 Moderate confidence (0.5-0.8): Softer language, "might/seems"
- 🔴 Low confidence (< 0.5): Explicitly request validation

### User Control
- Every insight can be validated/corrected
- Users can explicitly "teach" Futura
- Clear "reset learning" option per project

## Episode Generation Integration

```typescript
interface PersonalizationHints {
  strong_signals: Insight[],    // confidence > 0.8 - significant influence
  moderate_signals: Insight[],  // 0.5-0.8 - light personalization
  weak_signals: Insight[],      // < 0.5 - noted but not driving
  
  // Never compromised
  editorial_constraints: {
    maintain_analytical_rigor: true,
    evidence_grounding_required: true,
    intellectual_honesty: true,
    challenge_assumptions: true
  }
}
```

## MVP Implementation

1. **Phase 1**: Observation collection (implicit + explicit)
2. **Phase 2**: Basic confidence calculation
3. **Phase 3**: UI for insight validation
4. **Phase 4**: Decay and reinforcement logic

## Anti-Patterns to Avoid

- **Filter bubbles**: Never hide content that challenges user assumptions
- **Overconfidence**: Always show confidence levels and evidence
- **Rigid preferences**: All learning must be reversible/correctable
- **Quality compromise**: Personalization never trumps editorial standards

## Success Metrics

- User trust: % of insights marked as "accurate"
- Learning velocity: Time to reach 0.8 confidence on key preferences
- Correction rate: How often users need to correct Futura
- Content quality: Maintained regardless of personalization level

## References
- Memory Provider ADR: `06-memory-provider-abstraction.md`
- Two-Loop Architecture: `04-two-loop-memory-architecture.md`
- Futura Voice: `02-editorial-framework/04-futura-voice-and-purpose.md`
