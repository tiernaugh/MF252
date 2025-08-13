# Chat API Contract

This document defines the architectural contract for the chat functionality, ensuring a clear separation of concerns between client applications and the backend AI service.

## Core Principle: Backend Owns Prompt Engineering

To maintain flexibility and robustness, the backend server is solely responsible for all aspects of prompt engineering. The client's role is to deliver user input and relevant context in a structured format, not to dictate how the AI should be prompted.

### API Endpoint: `/api/chat`

-   **Method:** `POST`
-   **Request Body:** A JSON object containing a single key:
    -   `messages`: An array of `UIMessage` objects, representing the current chat history.

### Client Responsibilities

-   Maintain the local state of the chat conversation.
-   When the user sends a message, construct a new `UIMessage` object.
-   Attach any relevant context (e.g., user-selected text) to the `data` property of the user's message object.
    ```json
    {
      "role": "user",
      "content": "What are the implications of this?",
      "data": {
        "attachments": [
          { "id": "...", "text": "The selected text...", "preview": "..." }
        ]
      }
    }
    ```
-   Send the *entire* current `messages` array to the `/api/chat` endpoint.

### Server Responsibilities

-   Receive the `messages` array.
-   Parse the array to identify the latest user message and extract any attachments from its `data` property.
-   Inject a system prompt to define the AI's persona and task.
    -   Persona source: see `../02-editorial-framework/04-futura-voice-and-purpose.md`.
-   Format the attachment context and prepend it to the user's message content.
-   Transform the final array of messages into the format required by the specific LLM provider (e.g., OpenAI, Anthropic).
-   Execute the call to the LLM.
-   Stream the response back to the client using the Vercel AI SDK's UI Message Stream protocol.

### Rationale

-   **Decoupling:** The client doesn't need to know anything about the system prompt, the AI model being used, or how context is formatted. This allows the backend AI strategy to evolve independently of the frontend application.
-   **Flexibility:** We can A/B test different system prompts, add new context sources (e.g., user history from a database), or even swap out the entire LLM provider on the backend with zero changes to the client code.
-   **Security:** Prevents clients from manipulating the system prompt or other critical instructions.
-   **Simplicity:** The client's logic is kept simple: manage a list of messages and send it to the server.

---

## Current Recommendation (MVP)

- Single endpoint `POST /api/chat` using Vercel AI SDK streaming (Text Stream).
- Backend owns persona/system prompt; client never sees prompt internals.
- User message `data.attachments` limited to on‑page selections.
- Org‑level settings (e.g., locale, voice) applied server‑side.

---

## Alternatives Considered

- WebSockets for chat: more complex infra; SSE/Text Stream is sufficient for token‑by‑token UX.
- Client‑side prompting: rejected for security/consistency; backend must control prompts.
- Tool‑calling in request payload: defer; prefer server‑side orchestration for retrieval/tools in MVP.

---

## Open Questions / HMWs (Draft)

- HMW cap transcript size and summarise without losing local conversational context?
- HMW expose structured reasoning artefacts later without leaking chain‑of‑thought?
- Versioning: do we need `x-chat-contract-version` to allow backend prompt evolution?

---

## Future Work / Spikes

- Define error codes and client handling for streamed failures.
- Golden transcripts for contract tests (fixtures for CI).
- Example requests for: selection‑only, multi‑selection, no selection.

