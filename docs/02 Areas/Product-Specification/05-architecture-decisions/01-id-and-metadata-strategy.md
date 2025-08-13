# ADR 01: ID and Metadata Strategy

**Status:** Proposed
**Context:** As we define the data schema for core entities like `episodes` and `projects`, we need a consistent, scalable, and professional strategy for identifiers (IDs) and system metadata. These choices have long-term implications for our API design, database performance, and the user's trust in our AI systems.

---

## Decision 1: Identifier (ID) Strategy

We will use **prefixed, Cuid2 strings** for all unique identifiers in the system.

-   **Format:** `[prefix]_[cuid2_string]`
-   **Examples:** `proj_t1o2p3q4r5`, `ep_s5t6u7v8w9`, `user_x1y2z3a4b5`

### Rationale & Expert Input:

This decision is a synthesis of best practices for both developer experience and data architecture, informed by simulated advice from industry leaders.

1.  **Developer Experience & Intelligibility (Stripe Perspective):** Human-readable prefixes (`proj_`, `ep_`) are invaluable. They make IDs instantly identifiable in URLs, logs, support tickets, and API responses, which significantly reduces debugging time and improves overall system clarity. A raw UUID or Cuid2 string is a missed opportunity to build a more intelligible and professional system.

2.  **Scalability & Uniqueness (Pinecone Perspective):** For our backend, a globally unique, collision-resistant, and efficiently indexable key is non-negotiable. Cuid2 is a modern, secure standard for generating unique IDs that is more performant and secure than UUIDs. It is designed for high-performance, distributed systems.

By combining these two approaches, we achieve all key objectives: scalability, uniqueness, searchability, and developer-friendliness.

---

## Decision 2: Metadata Strategy

We will categorize all metadata into two distinct groups within our data models: user-facing metadata and system/audit metadata.

### Rationale & Expert Input:

This separation allows us to build a clean user experience while capturing the critical data needed for trust, transparency, and system improvement, based on simulated advice from UX and AI ethics leaders.

1.  **User Experience (Linear Perspective):** The user experience should be clean and focused. Users care about the publication *date* of an episode, not the precise nanosecond or timezone. We will store a full, precise **ISO 8601 timestamp with a UTC timezone** (`"2025-08-01T14:30:00Z"`) for all time-based data. This gives us unambiguous, timezone-aware data internally, which we can then format appropriately for the user's context in the UI (e.g., "August 1st", "Yesterday").

2.  **AI Trust & Auditability (Harvey & Anthropic Perspective):** For a professional AI tool, trust is paramount. We must capture metadata that allows for the auditing and explanation of the AI's generation process. To this end, we will include a `generationMetrics` object in the metadata for AI-generated content like episodes. This object will contain:
    -   `agentId`: The version of the agent that ran.
    -   `startTime` / `endTime`: The precise start and end of the generation process.
    -   `durationMs`: How long it took.
    -   `costUsd`: The direct cost of the AI calls.
    -   `modelsUsed`: An array of the specific model versions used.

This data is not just "interesting"; it is a core feature that demonstrates the rigor of our process and provides the foundation for building an explainable, trustworthy AI partner.

---

## Expert Review Addendum (2025-08-01)

Following a focused advisory mini-session, we are adding the following clarifications and future considerations, attributed to expert roles:

| Role | Focus Area | Key Insights |
|---|---|---|
| **Data Infrastructure Expert** | Data infrastructure & ID performance | • Reserve an optional `org` namespace prefix for future multi-tenant scenarios (`org_[cuid2]`).  
• Preserve a numeric `episodeNumber` alongside the unique ID for efficient chronological indexing. |
| **AI Alignment Expert** | AI auditability & alignment | • Include `promptTemplateVersion` and optional `memoryLinkage[]` to trace data provenance for generated episodes. |
| **Editorial Engagement Expert** | Editorial engagement | • Enforce a <120-word paragraph guideline for scan-ability.  
• Introduce optional `keyTakeaway` per analytical block for retention. |
| **UX & Prototyping Expert** | UX & dev-tool ergonomics | • Add optional `order` prop to each block to decouple rendering order from array index, enabling drag-reordering experiments.  
• Keep generated IDs ≤15 characters post-prefix for developer readability. |

### Impact on ADR
These points do not alter the core decisions but refine implementation guidelines:
- **Identifier Namespace:** Future production systems *may* prepend an organization ID to ensure global uniqueness across tenants.
- **Metadata Extensions:** The metadata object will gain optional fields (`promptTemplateVersion`, `memoryLinkage`) to support full AI audit trails.
- **Content Block Enhancements:** Optional `keyTakeaway` and `order` fields improve UX without breaking existing structure.

We will revisit this ADR once the prototype validates these additions.

---

## Open Questions / HMWs (Draft)

- HMW reconcile prefixed Cuid2 IDs with database UUIDs if we opt for UUIDs at rest?
- Do we need sortable numeric fields (e.g., `episode_number`) alongside IDs for fast ordering?
- What minimal audit metadata is required in MVP (created_by, updated_by, promptTemplateVersion)?

---

## Future Work / Spikes

- Decide production ID at‑rest format (UUID vs text) and API exposure (prefixed IDs).
- Add example ID/metadata mapping in the schema doc to keep consistency across packages.
