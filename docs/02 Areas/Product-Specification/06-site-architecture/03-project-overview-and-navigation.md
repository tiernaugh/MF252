# ADR-light: Project Overview & Site Navigation (MVP)

Status: Draft · Owner: Product · Last Updated: 2025-08-08

## Decision
Use a calm navigation model with a left sidebar on Home and Project pages (hidden on Episode). Project Overview is modular: Upcoming, Latest, Episodes list + search, Planning Notes, and Project Info.

## Rationale
- Keep the reading surface pristine (no sidebar on Episode)
- Provide quick entry/exit points on Home/Project without clutter
- Make “Upcoming” predictable and honest (influence window explicit)

## Architecture
- Sidebar sections: Home, Projects, Notifications, Profile (Stripe/billing later; follow next‑forge defaults)
- Project Overview modules:
  - Narrative hero with Futura avatar and intro copy (content‑first) ➝ Latest hero ➝ Upcoming ➝ Divider ➝ Previous list (+ search)
  - Upcoming (when `status='scheduled'`): `scheduled_at`, `preview_questions` (2–3), copy using `feedback_until`
  - Latest episode hero: title, dek, quote, Open CTA
  - Previous episodes: non‑openable preview cards (1–3) + search
  - Project info: `short_summary` (agent‑authored, non‑editable)
  - Header actions: "Project Settings" button → unified settings page with vertical tabs:
    - Tab 1: "Brief & Memory" (overview + memory transparency)
    - Tab 2: "Management" (cadence, pause/archive/delete, notifications)
- Episode header: project title uses Interactive Hover Button (“Back to Project”)
- Explorations (future): placeholder section to surface speculative scenarios when available

## Brief & Memory (MVP simplified)
- Project Brief: a read-only display of the core project instructions, sourced from a versioned table. An "Open Instructions" button will lead to a modal for proposing and applying changes.
- "Memories": The new name for "What Futura Knows". Displays memory items from Mem0 with individual delete buttons.
- Memory controls: toggle to enable/disable memory + "clear all project memory" button.
- Recent Steers: A section to display ephemeral, next-episode notes from the `planning_notes` table, which also shows the dynamically calculated next episode date.
- Removed "Key Themes" and "Sources Summary" from the UI to simplify the experience.
<!-- UX Note: This mirrors ChatGPT memory UX; aim for transparency and control, not prediction. -->

## Data hooks
- Lifecycle & cadence fields in DB: `scheduled_at`, `feedback_until`, `assembly_started_at`, `published_at`, `cadence_type`, `cadence_config`, `next_scheduled_at`, `short_summary`
- Project overview: `projects.onboarding_brief` (user-editable)
- Memory items: Mem0 vector store (project-scoped queries)
- Pause state: `projects.is_paused` (new field)
- Search infra: plan `episodes_search` tsvector per project; block search is fast‑follow
<!-- Implementation Note: Memory item delete should call Mem0 delete by item ID; "clear all" performs a scoped batch delete. -->

## Adopted patterns (from next‑forge)
- Auth gating in layout: use `currentUser()` and `redirectToSignIn()` in the authenticated layout rather than per‑page guards.
- Sidebar scope: wrap Home/Project in `SidebarProvider` + `GlobalSidebar` (`variant="inset"`); omit provider entirely for Episode pages.
- Org context: surface `OrganizationSwitcher` (hide personal, redirect after select) at the top of the sidebar.
- Sidebar ergonomics: persist state via cookie; enable “b” keyboard shortcut; expose `SidebarTrigger` in page headers; use Sheet on mobile.
- Theming: use the themed `ClerkProvider` tied to `next-themes` to keep auth UIs visually consistent.
- Server actions: access `clerkClient()` in server actions when fetching org membership lists.

## Open questions
- Notifications surfacing (top‑bar icon vs sidebar)
- Tabs vs single page on Project Overview
- Timing for “Global projects” section

## References
- PRD: `01 Projects/navigation-and-project-overview/prd.md`
- DB ADR: `05-architecture-decisions/05-database-schema.md`
