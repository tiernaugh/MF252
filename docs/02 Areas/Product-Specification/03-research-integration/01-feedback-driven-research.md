# Feedback-Driven Research: Steering the n8n Workflow

This document specifies how user feedback, captured via the mechanisms defined in the [Editorial Feedback Loop](mdc:../02-editorial-framework/01-feedback-loop.md), directly influences and steers the `n8n` agentic research workflow. The goal is to create a tight loop where user direction has a clear, tangible impact on research priorities.

## 1. Core Principle: User Choice as a Primary Input

The single most important feedback signal for the research workflow is the user's explicit "next direction" choice at the end of an episode. While block-level feedback shapes the *style* of the episode, the directional choice shapes its *substance*.

## 2. Short-Term Research Steering (MVP)

For the MVP, the `n8n` workflow for a new episode will begin with a "Fetch Feedback" node.

1.  **Trigger**: The workflow is triggered for the next episode.
2.  **Fetch Feedback Node**: Queries the `episode_feedback` table for the most recent entry from that user.
3.  **Extract Direction**: Extracts the `next_direction` string.
4.  **Prioritize Research Queries**: This string becomes the primary input for the subsequent research nodes (e.g., Perplexity API calls).

### Example MVP Workflow:

-   User selects: `"New types of project briefs"` as the next direction.
-   The n8n workflow retrieves this string.
-   The "Primary Research" node executes queries like: `"latest examples of AI consulting project briefs"`, `"how are companies scoping AI strategy projects"`, etc.

This ensures the research phase is immediately and precisely aligned with the user's stated interest.

### Handling the "Let Futura Choose" Option

If the user delegates the choice, the workflow will analyze `block_ratings` from the previous episode, identify the theme of the highest-rated `💡 Possibility Block` or `🧠 Pattern Block`, and use that theme to seed the research.

## 3. Long-Term Research Refinement (Post-MVP)

This describes how the research process evolves from being reactively steered by the last episode's feedback to being proactively informed by the agent's updated long-term memory.

### Principle:
As the agent's core understanding of the user's interests (stored in `Mem0` and project instructions) is refined, the research process should become more nuanced and intelligent.

### Proposed Workflow:
The `n8n` research workflow will be enhanced to include a "Fetch Core Profile" node at the beginning.

1.  **Fetch Core Profile**: Before fetching the latest episode feedback, the workflow will retrieve the user's foundational profile from `Mem0`. This profile contains the long-term, learned interests (e.g., "high interest in the intersection of product design and financial services").
2.  **Synthesize Inputs**: The workflow will then combine the **long-term interests** from the core profile with the **short-term directional choice** from the latest feedback.
3.  **Generate Nuanced Queries**: This synthesis allows for much more specific and valuable research queries.

### Example Post-MVP Workflow:
-   **Core Profile (from Mem0)**: Contains a learned interest in `"product design consulting"` and `"financial services"`.
-   **Latest Feedback**: User selects `"New types of project briefs"` as the next direction.
-   **Synthesized Research Queries**: The "Primary Research" node in n8n can now generate highly specific queries that combine these concepts:
    -   `"examples of product design consulting project briefs in financial services"`
    -   `"how are fintech companies scoping AI strategy projects"`
    -   `"RFP language for generative AI implementation partners in the banking sector"`

This evolution marks the shift from a simple, directed research agent to a true thinking partner that understands a user's evolving context and priorities, leading to exponentially more valuable insights over time.

## 4. MVP Scope and Limitations

*   **Batch Processing**: Feedback is processed at the start of the next episode's generation.
*   **Simple Prioritization**: The user's most recent choice is the top priority.
*   **No Free-Form Text Analysis**: Optional text feedback is not programmatically analyzed in the MVP.
