# Editorial Feedback Loop: Translating User Input into a Smarter Agent

This document outlines the editorial logic for how Futura learns from user feedback. It defines the mechanisms that translate simple user interactions (ratings, choices) into tangible improvements in future episodes, making the agent feel more personalized and intelligent over time.

## 1. Core Principle: Implicit Learning Over Explicit Configuration

For the MVP, our goal is for Futura to learn implicitly from user behavior rather than asking the user to manage complex settings. The feedback loop should feel natural and rewarding, not like a configuration task.

## 2. Feedback Integration Workflow

The process of turning feedback into action follows a clear, two-stage workflow:

1.  **Data Capture**: The frontend captures user ratings and choices and stores them in the database.
2.  **Editorial Synthesis**: The `n8n` workflow retrieves this feedback data during the generation of the *next* episode and uses it to adjust the content strategy.

### Key Decision for Review:
*   **Feedback Timing**: When does episode feedback get processed by n8n?
    *   **Proposal**: For the MVP, feedback should be processed in a batch. The workflow for Episode #3 will query all feedback from Episode #2. This simplifies the initial build.
    *   **Alternative**: Real-time influence could be explored post-MVP, where feedback immediately influences a research cycle. This adds complexity but could feel more responsive.
    *   **Recommendation**: Proceed with batch processing for the MVP.

## 3. Block-Level Feedback Logic (`block_ratings`)

Block-level 👍👎 ratings are the most granular signal. They primarily influence the **composition and style** of future episodes.

*(Note: The effectiveness and design of this binary feedback mechanism is under review. A separate task has been created to prototype and test more descriptive feedback options.)*

### Conceptual Model: `BlockFeedbackImpact`

This interface defines how a rating can affect future content.

```typescript
// How block ratings influence content strategy
interface BlockFeedbackImpact {
  block_type: string;        // 'Signal', 'Question', 'Pattern', etc.
  user_rating: 'up' | 'down';
  impact_on_future: {
    // Adjusts the overall mix of block types in the next episode
    content_balance_adjustment?: number; // e.g., +5% for this block type
    // Signals a need to refine the approach for this block type
    refine_block_approach?: string; // e.g., "User prefers more data-heavy signals"
  };
}
```

## 4. Episode-Level Feedback Logic (`episode_feedback`)

Episode-level feedback provides a high-level signal about overall satisfaction and, crucially, sets the **thematic direction** for the subsequent episode.

### Conceptual Model: `EpisodeDirectionImpact`

This interface defines how the user's directional choice affects the research and generation process.

```typescript
// How episode direction choice affects the n8n workflow
interface EpisodeDirectionImpact {
  selected_direction: string; // The literal string of the chosen option
  // Instructs the research agent to focus on specific keywords or themes
  research_priority_adjustment: Record<string, number>; // e.g., { "procurement language": 1.5 }
  // Provides a clear topic for the next episode's "Cold Open"
  next_episode_focus: string[];
}
```

## 5. Short-Term Feedback Integration (MVP)

In the MVP, feedback provides weighted inputs for the **next immediate episode's** generation logic.

*   **Content Balance Adjustments**: Thumbs-up ratings on certain block types will be stored as a simple counter. The n8n workflow will check this counter and adjust the target percentages for the `Content Balance Framework`.
*   **Topic Interest Evolution**: The `selected_direction` from episode feedback is the strongest signal of topic interest. This choice will be stored and referenced in the `Cold Open` of the next episode to create a feeling of continuity.

## 6. Long-Term Memory Integration (Post-MVP)

This describes how feedback evolves from steering the next episode to refining the agent's core understanding of the user over the long term.

### Principle:
Strong, persistent feedback signals should be used to update the user's foundational `Mem0` profile and the project-level instructions. This transitions Futura from a reactive agent to a proactive, learning partner.

### Triggers for Memory Updates:
A memory update should be triggered when a clear pattern emerges, for example:
*   A user selects directions related to the same sub-topic (e.g., "financial services") for 2-3 consecutive episodes.
*   A user consistently gives 👍 ratings to a specific type of content (e.g., highly speculative `Tension Blocks`).

### Proposed Workflow:
1.  **Pattern Detection**: An `n8n` workflow runs periodically (e.g., monthly) to analyze feedback patterns across multiple episodes.
2.  **Proposed Update Generation**: If a pattern is detected, the system generates a proposed update. For instance:
    *   **Input**: User consistently chooses directions related to "product design consulting in financial services."
    *   **Proposed Update**: "Amend project-level instructions to note a high interest in the intersection of product design and financial services."
3.  **Human-in-the-Loop Review**: **Crucially**, these updates are not automatic. They are flagged for human review (by the solopreneur) to ensure the agent's learning is accurate and valuable.
4.  **Memory Update**: Once approved, the update is committed to the user's profile in `Mem0` or the project's master instruction set.

This two-speed approach—immediate influence on the next episode and considered updates to long-term memory—allows for a powerful and sophisticated learning loop that remains robust and controllable.
