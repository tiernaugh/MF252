# Platform Purpose and Vision: Many Futures

## 1. The Big Idea (Elevator Pitch)
Many Futures is an **agentic foresight assistant** for strategy consultants and innovation leads. It replaces scattered, manual trend-watching with a personalised, automated weekly intelligence briefing (an "episode") that helps businesses anticipate and explore change.

## 2. The Problem We Solve
Strategic foresight is critical but broken. It's time-consuming, expensive, generic, and quickly becomes outdated. Teams rely on a messy combination of newsletters, reports, and ad‑hoc research, leading to information overload and a weak signal‑to‑noise ratio. They lack a systematic way to connect emerging trends directly to their unique business context.

## 3. Our Solution: The Agentic Foresight Assistant
We deliver a sharp, personalised, and continuous stream of strategic intelligence.

### How it Works:
1.  **Contextual Onboarding:** A user signs up and, through a quick conversational flow, provides their company's context, strategic interests, and preferred information sources.
2.  **Automated Weekly Episodes:** Every week, our AI agent proactively researches this context, identifies emerging signals, and generates a structured, easy‑to‑digest "episode" of insights, trends, and scenarios.
3.  **Personalised & Actionable:** Content is presented in a block‑based format (insights, trends, questions) that users can rate. This feedback loop continuously refines the AI's focus, making each episode more relevant than the last.

## 4. Target Audience (The "Who")
Our initial focus is on **strategy consultants and innovation leads** at small to medium‑sized businesses.

- **Pains:** They are time‑poor, need to stay ahead of the curve for their clients/stakeholders, and struggle to filter noise from signal.
- **Gains:** They get a "superpower" – a virtual research assistant that constantly scans the horizon for them, delivering curated intelligence that makes them look smarter and more prepared.

## 5. Core Value Proposition (The "Why")
**"Stay ahead of change, effortlessly."**

Many Futures provides:
- **Automation:** Frees up hours of manual research and reading.
- **Personalisation:** Delivers insights directly relevant to *your* business, not generic industry reports.
- **Continuity:** Creates a living, evolving understanding of the strategic landscape.
- **Actionability:** Presents content in a way that sparks strategic conversation, not just passive consumption.

## 6. The Vision (Where We're Going)
Beyond the MVP, Many Futures will evolve into a collaborative foresight platform. It will become the central nervous system for a company's strategic thinking, enabling teams to not just anticipate change but to model its impact, simulate responses, and build a proactive, future‑literate culture. We envision a tool that transforms foresight from a high‑cost, episodic consulting engagement into a low‑cost, continuous internal capability.

---

## 7. Near‑Term Focus (MVP)
- **Single‑user first:** Individual account with a personal organisation by default; collaboration later.
- **Episodes + Side‑panel:** Weekly episodes and a non‑modal chat side‑panel that feels grounded (attachments from page selections, streaming responses).
- **"Smoke & mirrors" to learn:** Front‑end prototypes to validate UX and data packets; production follows once patterns are proven.
- **Just‑enough docs:** ADR‑first for consequential choices; keep documentation lean and actionable.

## 8. Working Principles
- **Prototype for signal; document for production.**
- **Accessibility and responsiveness** are first‑class; streaming should feel calm and quick.
- **Privacy by scope:** User/organisation/project boundaries apply to data and memory.
- **Token discipline:** Keep prompts lean; reserve headroom for model responses.

## 9. Architecture Anchors (Pointers)
- **Two‑Loop Memory:** Editorial loop → Conversational loop hand‑off.
- **Context Strategy (L0–L6):** Layered retrieval/packing; attachments enrich context.
- **Database Schema:** Organisations → Projects → Episodes → Blocks (+ metadata).
- **Memory Provider:** Pluggable layer (Mem0 default, pgvector baseline fallback).
- **Streaming:** Next.js route handlers with Vercel AI SDK (text streaming).

> See ADRs in `05-architecture-decisions/` for concise records; start at the handover: `docs/00 Index/handover-technical-context.md`.

## 10. What Success Looks Like (MVP)
- Users get to first value quickly (minutes, not hours).
- Weekly episode feels credible and relevant; chat answers feel grounded in page context.
- Streaming starts fast and remains stable; UI stays accessible and responsive.
- Decisions are captured succinctly; production build reuses validated patterns without rework.

## 11. Out of Scope (MVP)
- Team collaboration and role management beyond a personal organisation.
- Complex tooling/function‑calling; advanced research workflows.
- Heavy citation management or long‑term research graphs (kept minimal initially).
