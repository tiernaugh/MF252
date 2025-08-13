# Site Architecture: Navigation & Core Flows (Mature Experience, ADR‑light)

Status: Draft | Owner: Product | Last Updated: 2025-08-08

This document captures the navigation and core flows for a mature product experience, aligned to the org → project → episode model and Clerk defaults. It is discovery/definition (ADR‑light), intended to guide prototyping in `many-futures-prototype-v4/` before production hardening in `many-futures/`.

---

## 1. Information Architecture (entities & relationships)

- **User → Organisation → Project → Episode**
  - A user belongs to a single default organisation on account creation (e.g., “My Team”).
  - An organisation contains projects; a project contains episodes (daily cadence by default; upcoming preview supported).
  - Day‑one: single‑user owner model. No collaboration features yet, but the data model should be ready for roles later (owner, admin, editor, viewer).
- **Clerk alignment**
  - Adopt Clerk’s Organisations out of the box for account management and default org creation.
  - Authorisation maps to org scope; future episode visibility can inherit from project with per‑episode override.

---

## 2. Navigation model (no breadcrumbs)

- **Global top bar**
  - Left: logo → Projects (home). Middle: contextual page title/actions. Right: org switcher (future), account menu, notifications (minimal).
  - No breadcrumbs (clean interface). Use clear page titles and consistent entry points instead.
  - Project title on Episode page is an interactive control. On hover/focus it reveals a compact pill button (“Back to Project”) that navigates to the project page. Keyboard accessible; visible focus ring.
- **Primary screens**
  - Projects overview: list of projects with key signals (last updated, next episode ETA, tags). CTA: “Start new project”.
  - Project home: tabs or sections for Overview (synopsis, upcoming), Episodes (index + filters/search), Settings (minimal now).
  - Episode detail: reading surface + chat side‑panel; footer planning note; Sources pill per block.
  - Account: profile, org name (“My Team”), billing (future).
- **Routing (Next.js)**
  - Path‑based, stable, shareable:
    - `/projects` → overview
    - `/projects/:projectId` → project home (default Episodes tab)
    - `/projects/:projectId/episodes/:episodeId` → episode detail
    - `/account` → account
  - Future: optional subdomain per org. Keep routes portable now.

---

## 3. Key flows

- **3.1 Projects overview**
  - Card list. Each card shows: project title, last episode date, upcoming episode status (e.g., “Arrives 7am tomorrow”), and quick “Open latest”.
  - Filters: status (active/archived), updated time, tag chips (future).

- **3.2 Project home (Episodes + Upcoming)**
  - Left column: Episodes index (reverse chronological). Search within project (block‑level match in future).
  - Right column (or top section): “Upcoming episode” preview is always present when `status='scheduled'`.
    - Shows planned publish window (`scheduled_at`), and 2–3 key questions from `preview_questions`.
    - Indicates “Shaped by your planning notes until [feedback_until]” when applicable.
  - Latest episode highlight: most recent `published` episode with title/dek/date.
  - CTA: “Open latest episode” and “Adjust focus” (footer note within episodes; no project‑wide chat for now).

- **3.3 Episode detail**
  - As in prototype: readable blocks, Sources pill, chat side‑panel, footer “Guide the next episode”.
  - Header interaction: Project title uses an Interactive Hover Button pattern. Default is calm; hover shows dark pill with arrow; activates navigation.

- **3.4 Account & org defaults**
  - On first login, create default org “My Team”. Project visibility defaults to org‑internal. No external sharing at day one.

- **3.5 Notifications**
  - Minimal: “New episode published” (in‑app + email). Future: “New free/global project available to subscribe”.

---

## 4. Creation & onboarding (pointer)

- New project creation uses a conversational briefing flow ("hire a researcher, not fill a form").
- **Implementation Status:** ✅ Complete with GPT-5 integration and first principles prompting
- See [04-new-project-conversational-ui-prd.md](04-new-project-conversational-ui-prd.md) for full requirements and implementation details.
- Key features:
  - Natural conversation with Futura (collaborative explorer voice)
  - 2-3 turn exploration before brief generation
  - Canvas-style brief editing
  - Edge case handling (repetitive, hostile, confused inputs)

---

## 5. Search (scope & future)

- Day one: project‑level search across episodes (by title/synopsis; future: block content with match highlighting).
- Future: global search across projects/org with filters (org, project, date, tags).
 - Data hooks: consider `episodes_search` tsvector (title, summary) per project as outlined in the DB ADR.

---

## 6. Permissions & visibility (designed for future)

- Day one: internal‑only episodes; architect for per‑project default visibility with per‑episode override later.
- Non‑account users: no chat; public read views considered later with constrained context.

---

## 7. Future feature: Universal (global) projects

- Concept: a curated set of global projects that all users can access (marketing/top‑of‑funnel; may syndicate to Substack).
- Architecture hooks:
  - Project flag `isGlobal: boolean` with optional `subscriptionEnabled: boolean`.
  - Access policy: global projects readable by all authenticated users; do not count against personal project limits.
  - Delivery: can appear in Projects overview under a “Recommended” or “Global” section; users can “follow/subscribe”.
  - Later: public web share with limited chat or no chat.

---

## 8. Instrumentation (MVP)

- Events: project_created, episode_published, upcoming_viewed, project_search, episode_opened, planning_note_submitted.
- Goals (success criteria):
  - Find upcoming episode in one click from Project home.
  - Create a project in < 60 seconds via conversational flow.
  - Navigate projects/episodes without dead‑ends; no breadcrumbs required.

---

## 9. Open questions / HMWs

- HMW make “upcoming” useful yet lightweight? (key questions, ETA, and a short synopsis without over‑promising)
- When to introduce org switcher UI if multi‑org becomes relevant?
- Best placement for project search (top bar vs. project page only)?
- How/when to surface “Global projects” without cluttering Projects overview?
 - Microcopy for Upcoming: confirm language for the influence window (e.g., “Accepting planning notes for ~10 minutes before the build starts”).

---

## 10. References

- Existing prototype header/navigation: `many-futures-prototype-v4/`
- Chat experience & Sources UI: `[07-chat-experience-and-api.md](../07-chat-experience-and-api.md)`
- Teams & accounts (future): `02 Areas/Product-Specification/Teams-Accounts.md`

