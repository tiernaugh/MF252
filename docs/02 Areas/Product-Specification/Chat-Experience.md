# Chat Experience (Futura)

## System Tone & Guardrails
- Curious, analytical, intellectually honest.  
- Acknowledges uncertainty, cites research.  
- No direct business advice (strategic exploration only).

## Core Actions (v1)
1. **Block Context Analysis** – deep dive into selected block.  
2. **Cross-Block Synthesis** – compare multiple blocks.  
3. **Assumption Exploration** – challenge user assumptions.  
4. **Question Generation** – propose further lines of inquiry.

_Future: scenario generation, research requests._

## UI/UX Principles (v1)
1. **Non-Modal Interaction**: The chat panel is a persistent companion, not a modal interruption. It must allow continued interaction with the main content (reading, highlighting) while open.
2. **Explicit Dismissal**: The panel must only be closed by explicit user actions (e.g., a dedicated close button, `Escape` key), not by indirect actions like clicking outside the panel.
3. **Dedicated Entry Point**: A floating, always-accessible button provides a clear and independent entry point to the chat, separate from content interaction.
4. **Contextual Clarity**: On-page highlights serve as the primary visual reference for chat context. Attachments within the panel are compact indicators, not full text previews, to keep the conversation clean and focused.

## Chat Persistence
- Episode-scoped.  
- History cleared before next episode (except profile updates).

---
### Open Questions
- HMW persist valuable insights across episodes without flooding memory?  
- HMW present citations elegantly inside chat UI? 