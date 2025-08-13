# Architecture Decision: LLM Context Packing & Memory Strategy

**Status:** Draft  
**Owners:** Product & AI Engineering  
**Related Docs:**  
- 07-chat-streaming-architecture.md  
- 02-chat-api-contract.md
 - ../02-editorial-framework/04-futura-voice-and-purpose.md

---

## 1. Problem Statement

Futura’s value comes from sounding *informed* – about the current episode, prior episodes, and the wider project goals. A key part of this is not just providing answers, but explaining the reasoning behind them in a way that builds trust and avoids the feeling of hallucination.

The prototype currently streams only the user-selected text. For production we must:

1.  Decide **which data** the backend should supply to the LLM to provide this "grounded reasoning".
2.  Keep the prompt **within the context window & cost budget**.
3.  Architect the system to seamlessly weave in this reasoning layer without needing to cite it as an external "source".
4.  Lay the groundwork for **Mem0** long-term memory integration.

---

## 2. The Principle of Grounded Reasoning

A core design decision is how Futura uses hidden "Block Metadata".

-   **❌ It is NOT for citation:** We will not surface this metadata to the user as a "source" with footnotes or links. It is not an external document.
-   **✅ It IS for reasoning:** This metadata represents the pre-loaded thought process, rationale, and connective tissue behind the visible content. Its purpose is to give Futura a "memory" of the *why*, enabling it to construct more robust, logical, and defensible explanations for its insights. It allows Futura to explain *how* it arrived at a conclusion, using the metadata as its internal, foundational logic.

This approach enhances the feeling of intelligence and coherence without breaking the conversational flow with source management.

---

## 3. Content Hierarchy

```
Workspace
└─ Project (e.g., "AI impact on design consultancy")
   ├─ Editorial Style   (tone, length guidelines, persona tweaks)
   ├─ Episode[n]
   │   ├─ Episode Metadata  (title, subtitle, pub-date, #index)
   │   ├─ Episode Summary   (vector embedding & 1-paragraph synopsis)
   │   └─ Block[m]
   │       ├─ Block Text (visible)
   │       └─ Block Metadata (hidden reasoning, research_context, signals, etc.)
   └─ Project-Level Memories (running themes, key tensions, strategic goals)
```

---

## 4. Context Layers (Production Target)

| Level | Sent *every* turn | Retrieved on-demand | Stored in Mem0 | Notes |
|-------|-------------------|----------------------|---------------|-------|
| L0    | System prompt (persona & guard-rails) | — | Config file |  
| L1    | User message + highlighted text       | — | Ephemeral    | Already implemented  
| L2    | *Block Metadata* for all attached highlights | — | Episode DB  | **Provides Grounded Reasoning.** Injected server-side, not for citation.
| L3    | *Episode Synopsis* (≤ 750 tokens)          | Vector search if query refers to prior content | ✅ | Provides narrative arc  
| L4    | *Cross-Episode Summaries* (1-2 sentences each, max 5 previous) | Vector search | ✅ | Maintains continuity  
| L5    | *Project Memories* (themes, objectives)   | Entity search via Mem0 | ✅ | Personalises analysis  
| L6    | *User / Org Preferences* (tone, depth)   | KV lookup in Mem0 | ✅ | Optional  

> Only **L1 + L2** are guaranteed every turn.  Higher levels are added **progressively** when relevance ≥ threshold to stay within context-window.

Note: L2 reads from each block’s `grounded_reasoning_metadata`. `research_citations` remain UX/audit affordances and are not injected as sources.

---

## 5. Retrieval & Packing Algorithm (v0.1)

1.  **Start** with system prompt + L1.
2.  **Add L2**: for each attachment, append structured metadata bullets under a general `## Internal Context` heading.
3.  **Episode Scope Check**  
    - If the user references prior *parts of this episode* (regex on "above", "earlier", headings), append L2 metadata for those blocks.
4.  **Cross-Episode Check**  
    - Embed user message → cosine similarity against stored episode summaries.  
    - Inject up to *N* highest-scoring episode summaries (L3/L4) until token budget ≈ 85 %.
5.  **Long-Term Memory Check**
    - If token budget allows, call `mem0.search()` with the user's message and the relevant context IDs (`user_id`, `organization_id`, `project_id`).
    - Inject the returned high-relevance memories (L5/L6) as YAML under a `# Long-term Memory` heading.
6.  **Return** final message array to `streamText()`.

Token guard: reserve 15 % of max-tokens for assistant response.

---

## 6. Mem0 Integration Outline (MVP default)

| Component | Responsibility |
|-----------|----------------|
| **Mem0**  | Hybrid layer (vector + KV + optional graph). Stores long-term project memories and user/org preferences. Performs hybrid search and returns ranked memory items. |
| **Memory Scheduler (server)** | Implements Steps 3-5 above. Responsible for deciding *when* to call Mem0 based on heuristics (e.g., no call if message < 15 tokens & no cross-refs). |
| **Supabase / Postgres** | Authoritative store for episode + block metadata. |
| **Vector DB (pgvector on Supabase)** | Stores embeddings for blocks + episode synopses for similarity search. |

We will start with **Mem0 + pgvector** for MVP. Baseline fallback is **KV + pgvector** only; graph layer optional.

---

## 6.1 Planning Notes (MVP)

User guidance for the next episode is captured explicitly via a footer note, not implicitly from chat.

- Entity: `PlanningNote` (project scope)
  - Fields: `projectId`, `userId`, `note`, `source: 'footer'`, `createdAt`
  - Use: fed into the Editorial Loop; never shown in‑prompt to users
- Out of scope (MVP): in‑chat steering; auto‑inference from conversation
- Packing: `PlanningNotes` are not injected into the real-time conversational context (L1–L6). They are consumed asynchronously by the Editorial Loop to influence the *next* episode's synthesis, ensuring a clean separation between immediate chat and long-term planning. Short-term notes (`scope='next_episode'`) are explicitly excluded from Mem0 promotion.

This keeps the UI calm and the planning signal explicit.

---

## 6.2 Citations Strategy (Blocks)

- Storage: `research_citations` array on each block with `{ index?, source_title?, url, excerpt?, publication_date?, credibility? }`.
- Inline use: renderer shows footnote‑style list per block; inline anchors optional for later.
- Packing: citations are not injected verbatim; when needed, use excerpts inside L2 metadata as evidence bullets.
- Future: add cross‑episode dedupe and per‑source quality scoring.
## 7. Open Questions

1.  **Memory Governance** – who can delete / edit Mem0 memories?  
2.  **Privacy for multi-tenant orgs** – enforce orgId prefix in every memory key.  
3.  **LRU / Time-Decay** – automatic forgetting of stale Episode summaries?  
4.  **Tool-Calling Interface** – how will Futura request a Mem0 lookup mid-conversation (tools vs. server orchestration)?  
5.  **Cost Controls** – maximum number of memories injected per turn.

---

## 8. Next Steps

1.  Prototype the *retrieval & packing algorithm* in the Express backend (skip Mem0, use in-memory arrays).  
2.  Decide on vector DB (Supabase pgvector vs. Qdrant).  
3.  Draft ER diagram for project / episode / block tables with metadata columns.  
4.  Formalise Mem0 key schema (`mem:projectId:entityType:entityId`).

---

## 9. MVP Working Assumptions (Draft)

- Model: Use GPT-5 as the default model across chat and generation during MVP to maximise quality while we tune packing budgets.
- Cadence: Episodes default to daily during MVP to accelerate learning. This informs retrieval heuristics (recent episodes prioritised in L4).
- Context policy: L1 + L2 are always sent. Enable L3 (episode synopsis ≤ 750 tokens) and L4 (cross-episode summaries) progressively when relevant. Cross-episode recall is in; cross-project recall is disabled in MVP but preserved behind the interface for future enablement.
- Attachments: MVP limits attachments to page selections only; no files/images.
- Mem0: Start with hosted Mem0 for speed of integration; keep the provider abstraction clean to allow later self-host migration. Baseline fallback remains KV + vector only.
- Token guard: Reserve ≥ 15% of max tokens for assistant response. Keep a simple L5 trigger (only when coverage is clearly lacking and budget allows).

These assumptions are ADR-light and subject to refinement as we complete early probes.

> **Decision:** This document is the canonical reference for context-packing until replaced by an ADR in the production codebase.

---

## 10. Alternatives Considered (Snapshot)

- Server‑orchestrated retrieval (chosen) vs LLM tool‑calling mid‑turn: simpler control, fewer failure modes for MVP.
- Always‑on RAG vs progressive layers L1→L6 (chosen): budget discipline and clarity; add layers only when relevant.
- Centralised vector DB vs provider‑embedded vectors: start central (pgvector/Qdrant) for transparency and control.

---

## 11. Future Work / Spikes

- Relevance heuristics tuning for L3/L4 (episode summaries) across different episode lengths.
- Mem0 search trigger heuristics (L5/L6) and budget caps under load.
- Summarisation/roll‑up of stale episode summaries (LRU/time‑decay experiments).
- Prompt templating versioning and A/B harness for system prompt variants.
