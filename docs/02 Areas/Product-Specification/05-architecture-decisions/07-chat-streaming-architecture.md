# Architecture Decision: Chat Streaming Architecture (Next.js Route Handlers)

**Status:** Draft

**Owners:** AI & Platform Engineering

**Related Docs:**
- [Chat API Contract](mdc:../../../Product-Specification/02-chat-api-contract.md)
- [LLM Context Packing & Memory Strategy](mdc:03-llm-context-and-memory-strategy.md)
 - [Futura Voice & Purpose](mdc:../02-editorial-framework/04-futura-voice-and-purpose.md)

---

## 1. Decision

Standardise on **Next.js Route Handlers (Node runtime for MVP; Edge later)** with **Vercel AI SDK** for chat streaming. The application server owns prompt engineering and message sanitisation, and streams text to the client using the Text Stream protocol.

---

## 2. Rationale

- Aligns prototype and production transports; removes drift from ad‑hoc Express endpoints.
 - Node runtime for MVP simplifies dependencies, improves local debuggability, and avoids Edge limitations on SDKs while we stabilise contracts.
 - Edge runtime later reduces tail latency and improves p95 first token once dependencies are trimmed and stable.
- Vercel AI SDK provides stable streaming primitives, retries, and back‑pressure handling.

---

## 3. Contract (API boundary is stable across Node/Edge)

- Client sends `UIMessage[]` where user message `data.attachments` carries selected context.
- Server sanitises to `{ role, content }[]`, injects context (attachments, L2 metadata), and calls `streamText()`.
- Response is streamed as text; UI renders incrementally and shows a typing indicator.

```ts
// Pseudocode
export async function POST(req: Request) {
  const { messages } = await req.json();
  const clean = sanitise(messages); // drop id/parts/data, keep role/content
  const withContext = injectAttachments(clean);
  const result = await streamText({ model, messages: [system, ...withContext], temperature: 0.7 });
  return result.toTextStreamResponse();
}
```

---

## 4. Non‑Goals

- No Data Stream protocol for MVP.
- No tool‑calling in the request; retrieval is orchestrated server‑side per strategy.

---

## 4.1 Runtime Phasing

- MVP: Node runtime for `/api/chat` route handlers; stable network calls and easier debugging.
- Later: Migrate streaming handler to Edge for lower latency; keep heavy retrieval/assembly in Node.

---

## 5. Observability & Resilience

- Log p95 time‑to‑first‑token and total tokens per turn.
- Surface retryable vs fatal errors to the client; show graceful fallback UI.
- Add server‑side guards: max prompt size, truncation, rate limiting.

---

## 6. Runtime & Orchestration Phasing (External Advice Incorporated)

### MVP (Now)
- Runtime: Node (Next.js Route Handlers on Vercel); debuggable locally; no Edge dependency limits
- Orchestration: n8n Cloud (visual flows, minimal DevOps)
- Memory: Mem0 abstraction + pgvector (Supabase) for embeddings
- Quality: Constitutional checks inside prompts; light post‑gen filtering

### Later (Edge & Scale)
- Runtime: Edge for chat streaming and simple retrieval; heavy jobs remain in Node/long‑running flows
- Orchestration: Temporal or LangGraph for durable waits/retries and HITL
- Memory: Hybrid retrieval across episode/project/org; potential separate stores for short‑ vs long‑term context
- Quality: More automated guardrails; agent‑level QA roles

---

## 6. Outcomes

- Single, consistent streaming path across environments.
- Lower operational complexity and clear failure modes.

> **Decision:** Implement route handler and migrate prototype transport to match.

---

## 7. Alternatives Considered (Snapshot)

- **Vercel AI SDK v5 + Next.js Route Handlers (chosen)**: Native SSE/Text Stream, simple server-first orchestration, proven in prototype.
- **OpenAI Responses API (server-only)**: Simple integration, but fewer framework affordances than Vercel SDK; still compatible as an underlying transport.
- **LangGraph Server**: Powerful multi-step/tool orchestration; overhead not justified for MVP chat; reconsider when tooling grows.
- **Agents for Amazon Bedrock**: Managed agents + KB; streaming UX often less granular; vendor coupling; revisit for enterprise policy/guardrails.
- **n8n webhook flows for live chat**: Great for async jobs; weak fit for low-latency token streaming and backpressure.

---

## 8. Open Questions / HMWs (Draft)

- HMW ensure robust backpressure and abort handling for slow clients without server timeouts?
- HMW design model fallback (e.g., GPT‑5 → GPT‑4.1) with minimal UX disruption?
- What per-org/user rate limits protect cost/abuse while keeping UX fluid?
- Should we expose tool-calling later (retrieval/tools) via server orchestration vs LLM tools?
- Do we need a Data Stream path (structured JSON deltas) post‑MVP for richer UI states?

---

## 9. Future Work / Spikes (MVP)

- TTFT and throughput harness (Edge vs Node runtime, cold vs warm starts).
- Error taxonomy for streamed failures (retryable vs fatal) + client state mapping.
- Abort/interrupt support and graceful teardown across client ↔ server.
- Protocol tests: snapshot streaming transcripts for regression.
- Internationalisation hooks: org‑level voice/locale prompt infusion.
