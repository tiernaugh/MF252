# Architecture Decision: The Two-Loop Memory Architecture

**Status:** Draft
**Owners:** Product & AI Engineering
**Related Docs:**
- [LLM Context Packing & Memory Strategy](mdc:03-llm-context-and-memory-strategy.md)
- [Agentic Editorial Process](mdc:../../../Product-Specification/02-editorial-framework/02-Agentic-Editorial-Process.md)
- [Editorial Principles and Voice](mdc:../../../Product-Specification/02-editorial-framework/01-Editorial-Principles-And-Voice.md)

---

## 1. Core Concept

Many Futures operates on two interconnected memory systems, creating a virtuous cycle where deep, asynchronous analysis informs real-time, personalized conversation, and that conversation, in turn, informs future analysis.

1.  **The Editorial Loop (Asynchronous):** The agentic, offline process of researching and crafting an episode. Its primary output is richly annotated content.
2.  **The Conversational Loop (Real-time):** The user's live interaction with the episode content via the chat panel. Its primary output is a refined understanding of user intent and new, long-term memories.

![A diagram showing the two memory loops. The top loop is the 'Editorial Loop (Asynchronous)'. It starts with 'Mem0 & History', goes to '1. Analytical Foundation', then '2. Research Validation', and finally '3. Synthesis'. The output of this loop is 'Episode Blocks with Metadata & Citations'. An arrow points from this output to the second loop. The second loop is the 'Conversational Loop (Real-time)'. It starts with 'User highlights block & chats', which leads to 'Backend retrieves & packs context (Metadata, History, Citations)'. This goes to 'Futura responds with Grounded Reasoning', which then feeds back into 'Mem0 & History', completing the cycle and providing input back to the Editorial Loop.](https://storage.googleapis.com/cursor-diagram-images/image-1721862143714.png)

---

## 2. Loop 1: The Editorial Loop (Asynchronous)

This is the "smoke-filled room" where intelligence is forged before the user ever sees it. It follows the principles laid out in the [Agentic Editorial Process](mdc:../../../Product-Specification/02-editorial-framework/02-Agentic-Editorial-Process.md).

| Stage | Description | Key Inputs | Key Outputs |
| :--- | :--- | :--- | :--- |
| **1. Analytical Foundation** | The agent breaks down the problem space, maps systems, and forms initial hypotheses without being biased by research. | `Mem0` (Project Goals, User History), Topic | **Block Metadata:** The "Grounded Reasoning" layer. Internal thoughts, assumptions, and connections. |
| **2. Research Validation** | The agent seeks external evidence to support or challenge its initial analysis, using a multi-source strategy. | Analytical Framework, Source Hierarchy | **Research Citations:** The "Auditable Evidence" layer. Concrete, verifiable links to sources. |
| **3. Synthesis** | The agent weaves the reasoning (from Stage 1) and evidence (from Stage 2) into a coherent, user-facing narrative. | Block Metadata, Research Citations | **Episode Blocks:** The final text, ready for user consumption, with its underlying context attached. |

**The Handoff:** The process concludes by saving the final `Episode Blocks` to the database. Each block is a rich object containing the visible text, its associated `Block Metadata` (reasoning), and its `Research Citations` (evidence).

Block metadata vs citations (operational):
- `grounded_reasoning_metadata` is used internally by the LLM (L2) and is not shown as user‑visible citations.
- `research_citations` contains auditable sources that may be referenced inline by the renderer (e.g., `[1] Source`).

---

## 3. Loop 2: The Conversational Loop (Real-time)

This loop activates the moment a user highlights a block and opens the chat panel. It is governed by the [LLM Context Packing & Memory Strategy](mdc:03-llm-context-and-memory-strategy.md).

| Stage | Description | Key Inputs | Key Outputs |
| :--- | :--- | :--- | :--- |
| **1. Context Retrieval** | The user's action triggers the backend to assemble a dossier for the LLM. | User Message, Highlighted Block ID(s) | A structured "context package" for the LLM. |
| **2. Context Packing** | The backend intelligently prioritizes and packs data into the prompt based on relevance and token budget. | Context Package, `Mem0`, Vector DB | A final, optimized prompt for the LLM. |
| **3. Grounded Response** | The LLM uses the rich, layered context to generate a response that is deeply informed and can explain its reasoning. | Optimized Prompt | User-facing chat response. |
| **4. Memory Update** | Key insights from the conversation are sent to Mem0 for processing. Mem0's internal LLM extracts, structures, and stores important information, linking it to the relevant user, organization, and project contexts. | Chat Transcript, `user_id`, `org_id`, `project_id` | New or updated long-term memories in Mem0, available for future loops. |

**The Virtuous Cycle:** The memories created in Stage 4 of this loop become a crucial input for Stage 1 of the next Editorial Loop. This ensures that Futura's understanding of a project and a user's thinking evolves over time, making each new episode more relevant and insightful than the last.

---

## Open Questions / HMWs (Draft)

- HMW decide which conversation artefacts should feed back into the Editorial Loop without leaking chain‑of‑thought to users?
- What governance do we apply for memory edits/deletions across org/project scopes?
- How do we prevent “over‑fitting” to recent chats and preserve longer‑term themes?

---

## Future Work / Spikes

- Prototype the memory write‑back policy from conversational turns (selectors, thresholds).
- Define minimal observability for loop interactions (IDs, timings, token budgets) to support learning.


---

## ADR‑Light Note: Episode Footer Planning Note → Editorial Loop (MVP)

- Decision: Capture end‑of‑episode guidance as a `PlanningNote` (project scope) via a calm footer input. No chat hand‑off in MVP.
- Undo: Dropped for MVP. Simpler state model; users can submit another note to revise.
- Flow: Reader enters a ≤240‑char note or inserts a suggested note, submits → stored as `PlanningNote` → consumed asynchronously by the Editorial Loop when drafting the next episode brief.
- Boundaries: Notes are not injected into per‑turn chat context (L1–L4); they inform episode synthesis only. Short-term steers (`scope='next_episode'`) are auto-archived after use, preventing long-term memory pollution.
- Rationale: Keeps reading and conversation surfaces distinct, reduces cognitive load, and makes the planning signal explicit and governable.
