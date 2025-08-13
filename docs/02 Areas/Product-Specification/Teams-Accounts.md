# Teams & Account Structure

## "My Team" Default (v1)
Every user is auto-assigned to a personal team on sign-up.  
No sharing or collaboration in the initial release.

### Rationale
- Simpler mental model: *“My personal research agent.”*  
- Avoids early complexity of permissions & shared context.  
- Lays groundwork for future collaboration tiers.

## Team Metadata (MVP)
```json
{
  "team_name": "<user>’s Strategic Research",
  "organization": "optional company field",
  "industry_context": "e.g. Financial Services Design",
  "geographic_focus": "e.g. UK / Edinburgh",
  "team_size": 1,
  "subscription_tier": "professional",
  "created_at": "timestamp"
}
```

## Free → Paid Transition
- **Trigger:** After user completes Episode 1 of first project and attempts to access Episode 2 *or* create a second project.
- **Why:** Allows full value demonstration before paywall.

## Roles & Permissions
- v1: no roles (single owner).  
- Future: `owner` / `member` distinction when collaboration launches.

---
### Open Questions
- HMW record *industry_context* granularity without forcing user to choose from exhaustive list?  
- HMW surface upsell messaging at the moment of Episode 2 anticipation without feeling punitive? 