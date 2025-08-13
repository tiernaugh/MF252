# Architecture Decision: Projects Summary API and Projects Index (MVP)

Status: Draft · Owners: Product/AI Engineering · Last Updated: 2025-08-09

Related:
- Database Schema — `05-database-schema.md`
- PRD — `docs/01 Projects/home-page/prd.md`
- Navigation & Project Overview PRD — `docs/01 Projects/navigation-and-project-overview/prd.md`

---

## 1. Decision
Adopt a single "Projects Summary" read endpoint to power the Projects index (All Projects). The endpoint returns a paginated list of projects with minimal status/recency fields suitable for fast grid rendering and quick open actions.

---

## 2. Rationale
- The projects index should feel instant and predictable; a consolidated summary enables caching and quick TTI.
- Keeps the surface calm by avoiding mixed content types (episodes vs projects).
- Aligns with MVP goal: find/open project, understand status and recency, create new project.

---

## 3. Contract (Response Shape)

```json
{
  "projects": [
    {
      "projectId": "uuid",
      "title": "string",
      "shortSummary": "string",
      "isPaused": false,
      "nextScheduledAt": "ISO-8601 | null",
      "lastPublishedAt": "ISO-8601 | null",
      "episodeCount": 0
    }
  ],
  "pagination": { "cursor": "opaque|optional", "hasMore": false }
}
```

Notes:
- All date/times are ISO strings in UTC; UI renders date‑only per locale.
- Optional fields omitted when not applicable.

---

## 4. Mapping to Database Schema
- `projects.short_summary` → `shortSummary`
- `projects.is_paused` → `isPaused`
- `projects.next_scheduled_at` → `nextScheduledAt`
- `MAX(episodes.published_at)` → `lastPublishedAt`
- `COUNT(episodes.id)` → `episodeCount`

---

## 5. Selection, Filtering, Ordering
- Filters: `status in (all, active, paused)` where `active = NOT projects.is_paused`.
- Sorts (MVP): A–Z (`projects.title ASC`), Last published (`MAX(episodes.published_at) DESC`).
- Paging: Cursor-based recommended; offset acceptable initially.

---

## 5.a Display labels and trust signals (MVP + future)
- Cadence label in UI (e.g., "Weekly Intelligence") is a pure presentation mapping from `projects.cadence_type` (see DB ADR 7.b). API may return a simple `cadenceType` field; the client renders the label.
- Status chip derives from `projects.is_paused` (Active when FALSE).
- Future trust signal: `sourcesTracked` (all‑time distinct sources across published episodes). For MVP, omit; later, return integer sourced from `project_source_totals.distinct_sources_all_time`.

### 5.b Project Overview fields (used by client)
- Latest episode summary should include: `id, title, summary, publishedAt, sequence, readingMinutes, highlightQuote`.
- Upcoming should include: `scheduledAt, feedbackUntil, previewQuestions[]`.
- Previous episodes: `id, title, summary, publishedAt`.

---

## 6. Caching & Performance (MVP)
- Cache key: `projects-summary:{userId}:{filters}:{sort}:{cursor}`; TTL 30–60s.
- Invalidate on: episode publish within a project, project pause/resume, project create/delete.
- Target p95: first byte ≤ 300ms; index TTI ≤ 1s.

### Future-safe note: "Recent activity"
- If/when enabled, prefer a denormalized `projects.last_activity_at` maintained by trigger or background job:  
  `last_activity_at = GREATEST(COALESCE(projects.next_scheduled_at,'epoch'), COALESCE(MAX(episodes.published_at),'epoch'))`
- Indexing: `CREATE INDEX idx_projects_last_activity ON projects (organization_id, is_paused, last_activity_at DESC);`
- Supporting: `CREATE INDEX idx_episodes_project_published ON episodes (project_id, published_at DESC) WHERE published_at IS NOT NULL;`
- Cache invalidation: episode publish, cadence updates, pause/resume.

---

## 7. Accessibility & States
- Skeleton grid; empty states for no projects / no matches.
- Clear status dots; concise meta line with last published + episode count.

---

## 8. Observability
- Log `projects_summary_fetched` with counts and filter/sort.
- Error events: `failed_projects_summary_fetch` with cause.

---

## 9. Alternatives Considered
- Reusing Home Summary and trimming sections: mixes concepts and overfetches — rejected.
- Server-side rendering of grid with partial hydration: future consideration; not required for MVP.

---

## 10. Open Questions
- Multi‑org support: include `organizationName` now vs later.
- Add `upcomingCount` (scheduled/assembling) for signal density on cards.
