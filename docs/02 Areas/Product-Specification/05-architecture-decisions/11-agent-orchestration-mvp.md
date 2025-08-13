# Architecture Decision: Agent Orchestration (MVP)

Status: Draft • Owners: Product/AI Engineering • Last Updated: 2025-08-09

Related:
- Editorial Agent Episode Contract — `10-editorial-agent-episode-contract.md`
- Database Schema — `05-database-schema.md`
- LLM Context & Memory Strategy — `03-llm-context-and-memory-strategy.md`
- Episode Cadence & Scheduling — `09-episode-cadence-and-scheduling.md`

---

## 1. Decision
Use n8n Cloud as the orchestration layer for the MVP editorial episode pipeline. Keep implementation lean and Node/TS‑centric, with agents as HTTP/Function services. Document a clear migration path to Temporal if/when we need durable waits, complex retries, or richer human‑in‑the‑loop.

---

## 2. Rationale (Why this, now)
- Fast to ship: visual flows, managed hosting, built‑in HTTP/LangChain nodes
- Developer‑friendly: Node/TS functions for agents; easy to iterate
- Cost‑aware: predictable plan while we measure real execution volume
- Low lock‑in: agents exposed as services keeps orchestrator swappable later

---

## 3. Scope (MVP)
- Orchestrator: n8n Cloud
- Agents (Node/TS services): Research, Writer (Claude via Vercel AI SDK), QA/Guardrails
- Memory: Mem0 (default provider) + pgvector on Supabase for embeddings; baseline fallback (pgvector + KV) remains available
- Persisted Outputs: `episodes` + `blocks` per DB ADR; derived `sequence`, `reading_minutes`, `highlight_quote`
- Triggers: schedule (cadence) or event (`episode_ready_to_assemble`)

---

## 4. Minimal Flow (happy path)
1) Load Context → project + brief + style + planning notes (within window)  
2) Retrieve Context → RAG (pgvector) scoped to project/episode  
3) Research Agent → facts/citations  
4) Writer Agent → blocks + citations + highlight_quote  
5) QA/Guardrails → policy + citation checks (retry on fail)  
6) Persist → episode + blocks (atomic), set statuses, consume notes  
7) Invalidate caches + emit analytics

---

## 5. Guardrails (Lean for MVP)
- Prompts: constitutional/system prompts; require citations in outputs
- Validation: lightweight schema checks (JSON shape), citation presence
- Remediation: one retry with constrained prompt if validation fails
- Future: external guardrails (e.g., Llama Guard / NeMo), fact‑checking pass

---

## 6. Observability (MVP)
- Log per step: latency, model, token estimates, success/failure
- Store run ids + step metadata in DB for replay/debug
- Future: OpenTelemetry traces; LangSmith/Phoenix for eval/replay

---

## 7. Cost & SLA Targets (Initial)
- Budget: ~US$0.50 per episode (tune after measurements)
- Latency: end‑to‑end ≤ ~10 minutes for assembly; streaming chat unaffected

---

## 8. Security & Privacy
- Scope retrieval strictly by org/project/episode ids
- Redact PII in logs; avoid storing raw prompts/responses when not needed
- Prefer EU region services when available (review per deployment)

---

## 9. Migration Path (Temporal)
Adopt Temporal if/when we need:
- Durable, long‑lived workflows with event waits (editor approvals)
- Complex branching with robust retries/heartbeats
- Higher scale and SLOs for reliability
Keep agents as stateless services; define stable JSON contracts so orchestrator swap is low‑risk.

---

## 10. PoC Plan (1 week)
- Day 1–2: Seed pgvector; scoped RAG function; n8n skeleton (trigger → HTTP nodes)
- Day 3: Implement Research/Writer services; persist episode + blocks
- Day 4: Add QA/Guardrails step + retry; cache invalidation; analytics events
- Day 5: Load test (N episodes), capture latency/cost; refine prompts; docs

---

## 11. Open Questions (not blocking MVP)
- Which guardrails vendor/tools to standardize on post‑MVP?
- Do we stream intermediate drafts to UI for editor review (HITL)?
- Formal eval suite: quality, citation density, off‑brief detection thresholds
