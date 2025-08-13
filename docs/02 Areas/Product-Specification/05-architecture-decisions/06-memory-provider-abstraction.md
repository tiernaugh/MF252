# Architecture Decision: Memory Provider Abstraction

**Status:** Draft

**Owners:** AI Engineering

**Related Docs:**
- [LLM Context Packing & Memory Strategy](mdc:03-llm-context-and-memory-strategy.md)
- [Two-Loop Memory Architecture](mdc:04-two-loop-memory-architecture.md)
- [Database Schema](mdc:05-database-schema.md)

---

## 1. Decision

Adopt a pluggable Memory Provider abstraction to decouple application logic from a specific vendor (e.g., Mem0). The default provider will be `mem0`, with a baseline fallback that uses Postgres (pgvector + KV) without external dependencies.

---

## 2. Context & Rationale

- We want Mem0’s strengths (smart ingest, hybrid search, graph affordances) without vendor lock-in.
- Different deployments (local dev, CI, demo) benefit from a provider that can run with zero external services.
- Privacy and scope boundaries (user/org/project) must be enforced consistently regardless of provider.

---

## 3. Port & Adapters

### 3.1 Port (TypeScript)
```ts
export interface MemoryProvider {
  search: (
    query: string,
    scope: { userId: string; organizationId?: string; projectId?: string },
    options?: { limit?: number; minScore?: number }
  ) => Promise<Array<{
    id: string;
    title?: string;
    content: string;
    score?: number;
    scope: 'user' | 'organization' | 'project';
    metadata?: Record<string, unknown>;
  }>>;

  add: (
    items: Array<{
      content: string;
      scope: 'user' | 'organization' | 'project';
      scopeIds: { userId: string; organizationId?: string; projectId?: string };
      tags?: string[];
      metadata?: Record<string, unknown>;
    }>
  ) => Promise<{ inserted: number }>;
}
```

### 3.2 Adapters
- `mem0`: calls provider APIs with enforced scope prefixes and tags.
- `baseline`: stores embeddings in pgvector and key facts in a KV table; cosine similarity for retrieval.

Provider selected via environment: `MEMORY_PROVIDER=mem0|baseline`.

---

## 4. Scope & Governance

- All memory writes must include immutable scope IDs (`user_id`, `organization_id`, `project_id`).
- Keys and tags use a canonical scheme: `mf:{orgId}:{projectId}:{entity}:{entityId}`.
- Deletion requests are soft-delete by default; hard deletes require admin intent and audit trail.

---

## 5. Risks & Mitigations

- Vendor outage or API drift → baseline adapter ensures graceful degradation.
- Cost creep → adapter enforces size limits, truncation, and deduplication.
- Privacy leakage → adapter validates scope on both read and write.

---

## 6. Outcomes

- Faster iteration with Mem0 features while preserving optionality.
- Consistent API for the Retrieval & Packing layer (L5/L6) across environments.

> **Decision:** Proceed with the abstraction; implement `packages/memory` with ports/adapters and wire into the backend.

---

## 7. MVP Working Assumptions (Draft)

- Provider choice: Start with hosted Mem0 for speed; keep `baseline` adapter ready for local/dev and later self-host pivot.
- Scoping: Enforce `user/org/project` boundaries at the adapter interface. Cross-episode recall allowed; cross-project recall disabled in MVP.
- Model alignment: Default LLM is GPT‑5 for MVP. Keep budgets and payload shapes provider‑agnostic.
- Attachments: MVP limits chat attachments to on‑page selections only.

These assumptions align with context strategy and can be relaxed post‑MVP.

---

## 8. Alternatives Considered (Snapshot)

- Hosted Mem0 (chosen for MVP): fastest path, managed scaling; vendor coupling mitigated via adapter.
- Self‑hosted Mem0: control/cost benefits; higher ops complexity; revisit once feature fit stabilises.
- Direct Postgres (pgvector + JSONB) only: simplest footprint; misses Mem0 ingest/graph value; good as baseline fallback.
- Pinecone/Qdrant external vector: operational maturity; increases moving parts and cost for MVP.

---

## 9. Open Questions / HMWs (Draft)

- HMW enforce scope prefixes/tags so cross‑project recall is impossible by default?
- What is the retention/LRU policy for memories at project/org scope?
- How do we redact/anonymise PII in stored memories to meet privacy‑by‑scope goals?
- Migration path: what data we need to export to move away from Mem0 if needed?

---

## 10. Future Work / Spikes

- Spike: write adapter conformance tests (search/add semantics, scope enforcement).
- Spike: cost/latency comparison hosted Mem0 vs baseline on representative loads.
- Spike: export format (ndjson) to de‑risk vendor migration.
