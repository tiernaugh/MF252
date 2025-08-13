> DEPRECATED — Do not reference. This document has been superseded by:
> - Chat Streaming Architecture ADR (mdc:../05-architecture-decisions/07-chat-streaming-architecture.md)
> - Chat API Contract (mdc:02-chat-api-contract.md)
>
> Canonical sources above. Keep this file for historical context only.

# Spec: Chat Experience & API (v1)

**Status:** Deprecated | **Owner:** Product Team | **Last Updated:** 2024-12-05

This document specifies the requirements for the production-ready Chat Side-Panel, based on validated learnings from the `many-futures-prototype-v4` project.

---

## 1. Core User Experience Principles

The chat feature is not a gadget; it is a core part of the research workflow. Its design must be guided by the following principles:

-   **A Conversational Partner, Not a Modal Tool:** The chat is a persistent side-panel, not a disruptive modal. The user must be able to seamlessly read, scroll, and highlight content while the chat is open. The panel should only close upon explicit user action (Escape key or 'X' button).
-   **Context is Explicit and Visible:** The user must have a clear, persistent visual indicator of what context has been shared with the AI. This is achieved through a combination of compact "attachment" pills in the input area and persistent highlights on the source text itself.
-   **The Conversation is the Focus:** The UI should prioritize the dialogue. Attached context within the chat history should be minimal (previews), relying on the on-page highlights to provide the full context, thus keeping the chat log clean and readable.
-   **Effortless Entry:** The user must be able to initiate a conversation at any time, either contextually (by selecting text) or directly (via a persistent floating toggle).

## 2. Interaction Model & UX Flow (MVP)

### 2.1. Initiating a Chat
-   **Via Text Selection**:
    1.  User selects text within the episode content.
    2.  A floating toolbar appears **below** the selection (with an intelligent "above" fallback). The toolbar appearance is delayed by ~150ms to prevent flickering during selection.
    3.  Clicking "Add to Chat" opens the side-panel (if closed) and adds the selection as an attachment.
-   **Via Floating Toggle**:
    1.  A persistent, floating toggle button is always visible in the bottom-right corner when the panel is closed.
    2.  Clicking the toggle opens the chat panel directly, without any initial context.

### 2.2. The Conversation Panel
-   **Behavior**: The panel is non-modal. Clicking outside of it does not close it.
-   **Layout**: The panel slides in from the right, gently resizing the main content area with a smooth transition. No overlay or backdrop blur is used.
-   **Context Management (Attachments)**:
    -   Selections appear as compact, pill-shaped "attachments" above the input field.
    -   Each attachment shows a minimal preview (~15-30 chars). The full text is referenced via the on-page highlight.
    -   Attachments can be individually removed by clicking an 'X' icon.
-   **Persistent Highlighting**:
    -   Any text currently active as an attachment is visually highlighted on the main page (`background-color: rgba(99, 102, 241, 0.1)`).
    -   Removing an attachment instantly removes the corresponding highlight.

### 2.3. Sending a Message
1.  The user types a message and/or has attachments in the input area.
2.  Upon sending, both the text and all active attachments are sent to the backend.
3.  The user's message appears in the history, with a visual indicator of the attachments that were sent with it.
4.  The input area and attachments are cleared, ready for the next message.

---

## 2.4. Episode Footer — Planning Note (MVP)

Goal: Provide a calm, single action for guiding the next episode without entering chat.

- Title: “Guide the next episode”
- Helper: “Add a short note. We’ll use it when planning the next episode.”
- Input: single textarea (≤ 240 chars)
- Suggestions: three suggested notes rendered as a list under the input (listbox). Click or 1/2/3 inserts; Arrow keys navigate; Enter inserts; Shift+Enter replaces; Esc returns to the textarea. Suggestions disappear when clicked (session‑local).
- Primary action: “Guide the next episode”
- Confirmation: On submit, the entire footer swaps to a confirmation card “Saved for planning” with the note and a 5s Undo.
- Accessibility: role=listbox/option; aria‑activedescendant; focus rings.
- Out of scope (MVP): chat hand‑off from the footer; in‑chat steering. These remain in the roadmap.

Server treatment: map the note to a PlanningNote memory (project scope). See Memory Strategy.

### 2.5. Sources UI (Blocks)
- Each content block may include a `citations[]` array (see DB Schema ADR). When present, render a compact “Sources” pill inside the block’s padded frame.
- Pill visuals: up to 3 favicon circles derived from each citation URL (`{origin}/favicon.ico`) with graceful fallback to neutral dots; if there are more than 3 sources, show a `+N` counter.
- On expand: show a clean list with `[index]`, `sourceTitle`, link `url`, and optional `excerpt`. Typography and spacing match the footer confirmation card for a coherent language.
- Accessibility: summary must be keyboard‑focusable; links have descriptive text; reduced‑motion friendly.

## 3. Frontend Architecture (MVP)

-   **Component Library**: shadcn/ui built on Radix UI primitives.
-   **Core Components**:
    -   `ChatPanel`: The main container, managing the open/close state and overall layout.
    -   `MessageComponent`: Renders individual user or assistant messages, including associated attachments.
    -   `PromptInput`: The input area, including the display of active attachments.
    -   `HighlightToolbar`: The floating toolbar that appears on text selection.
    -   `PersistentHighlight`: A component that dynamically injects CSS to highlight attached text on the page.
-   **State Management**:
    -   **UI State**: A dedicated, lightweight store (e.g., Zustand, Jotai) should manage UI-specific state, such as `isPanelOpen` and the array of active `attachments`.
    -   **Chat State**: The Vercel AI SDK's `useChat` hook should be used to manage the core conversation state, including the `messages` array, API connection status, and streaming responses.

### 3.1. Detailed Layout & Scroll Requirements
-   **Fixed Input Area**: The chat panel must be implemented using a flexbox column layout (`flex flex-col`). The message list container must be the single growing element (`flex-1`) and have its own scrolling (`overflow-y-auto`). This ensures the header and input area are never pushed out of the visible viewport.
-   **Independent Scrolling**: To prevent overlapping scrollbars while allowing the main page to remain scrollable, a `margin-right` equal to the panel's width must be dynamically applied to the `<body>` element when the panel is open. This shifts the main page and its scrollbar to the left, creating distinct, side-by-side scroll zones.
-   **Auto-Scroll to Bottom**: Whenever a new message is added to the chat, the message list must automatically and smoothly scroll to the bottom, ensuring the latest message is always visible. This should be implemented with a `ref` attached to the bottom of the list and a `useEffect` hook that triggers on message changes.

---

## 4. Backend & API Contract (MVP)

The API contract is designed to create a clean separation of concerns, where the backend owns all prompt engineering.

-   **Endpoint**: `POST /api/chat`
-   **Request Body**: A JSON object containing a `messages` array of `UIMessage` objects from the Vercel AI SDK. Contextual attachments are embedded in the `data` property of the user's message.
-   **Server Responsibilities**:
    1.  Receive the full `messages` array.
    2.  **Sanitize the history**: Map the array to clean `{ role, content }` objects, stripping all other properties (`id`, `data`, `parts`, etc.) and filtering out any messages without valid content to prevent errors from the AI SDK.
    3.  Inject a system prompt to define the AI's persona.
    4.  Extract attachment text from the original user message and prepend it to the `content` of the sanitized user message.
    5.  Call the LLM with the final, clean message array.
    6.  Stream the response back to the client.

---

## 5. Context Architecture

The ability for the AI to draw on multiple layers of context is its key differentiator.

### 5.1. MVP Context Layers
-   **L1 - Highlighted Text**: The explicit text selected by the user. (Implemented)
-   **L2 - Hidden Block Metadata**: The server should identify the source block of the highlighted text and inject its hidden `_metadata` (research context, source signals, etc.) into the prompt. (Production implementation required).

### 5.2. V2+ Context Layers (Future Roadmap)
-   **L3 - Episodic Memory**: The AI should have the ability to reference content and metadata from previously viewed episodes in the same project.
-   **L4 - Project Context**: The AI should be aware of the overall project goals, themes, and key entities.
-   **L5 - Persistent Memory (Mem0)**: A long-term, cross-project memory layer that allows the AI to learn about a user's interests and research patterns over time.

---

## 6. Future Roadmap & Open Questions

### 6.1. V2 Features
-   **Conversation Management**:
    -   A "Clear Chat" button to start a fresh conversation within the same episode.
    -   A mechanism to browse and revisit previous chat conversations.
-   **Tool Calling**: Granting the AI the ability to use tools (e.g., search the web, query a database) to answer questions that go beyond the provided context.

### 6.2. Architectural Decisions to be Made
-   **Collaboration Model**:
    -   **Question**: Is the chat a private, per-user workspace, or is it a collaborative feature shared by a team?
    -   **Path A (Personal)**: Each user has their own independent chat history for each episode. This is simpler and ensures privacy.
    -   **Path B (Collaborative)**: A single, shared chat thread for an episode, where team members can see and contribute to the conversation. This would require real-time updates (e.g., via WebSockets) and a more complex UI.
-   **Data Persistence**: How and where are chat conversations stored? This needs a clear data model and will be influenced by the collaboration decision.
-   **Cost Management**: What rate limiting and token limits should be in place to manage API costs?
-   **Transparency vs. Magic**: Should the AI announce when it is using hidden context (e.g., "Drawing on the original research notes for this block, I can add that...")? This is a key UX decision balancing trust and a seamless experience.

---

## 7. Appendix: Mobile Experience

-   **Panel Behaviour**: The chat panel should be a bottom sheet, sliding up to cover 90-95% of the viewport.
-   **Dismissal**: Can be dismissed via a downward swipe gesture or by tapping a grab handle.
-   **Context Preservation**: The episode title or a small portion of the article should remain visible at the top to maintain context.
-   **Keyboard Handling**: The chat input must intelligently move to stay above the native device keyboard when it appears.

