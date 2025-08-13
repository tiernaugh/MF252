# Organization Auto-Creation PRD

**Status:** In Development  
**Date:** 2025-08-13  
**Priority:** Critical for MVP

## Problem Statement

Users are encountering "Oops, something went wrong" error after signing up because:
1. OrganizationSwitcher component expects organizations to be enabled
2. No organization is created for new users
3. The app architecture assumes users belong to an organization

## Solution Overview

Implement automatic organization creation on user signup, aligning with the "My Team" default concept from Teams-Accounts.md where every user gets a personal team/organization.

## User Journey

### Current (Broken)
1. User signs up via Clerk
2. User lands on authenticated page
3. Error: OrganizationSwitcher fails because no org exists
4. User sees "Oops, something went wrong"

### Proposed
1. User signs up via Clerk
2. Webhook triggers organization creation
3. Organization named "[User]'s Strategic Research" created
4. User added as owner/admin
5. User lands on authenticated page with working OrganizationSwitcher
6. User can immediately start creating projects

## Technical Requirements

### Phase 1: Enable Organizations (Immediate)
- Enable Organizations feature in Clerk Dashboard
- Configure organization settings:
  - Allow members to create organizations
  - Enable personal workspaces
  - Set default role as "owner"

### Phase 2: Auto-Creation Webhook
- Create `/api/webhooks/clerk/route.ts` endpoint
- Listen for `user.created` event from Clerk
- Auto-create organization with metadata:
  ```json
  {
    "name": "[User]'s Strategic Research",
    "slug": "auto-generated",
    "publicMetadata": {
      "plan": "trial",
      "createdAt": "timestamp"
    }
  }
  ```
- Add user as organization owner
- Update user's publicMetadata with default org ID

### Phase 3: Onboarding Enhancement (Optional)
- Check if user has organization on sign-in
- If not, redirect to simple onboarding
- Allow user to rename their organization
- Collect optional metadata (industry, company)

## Success Criteria

1. **No Errors:** Users can sign up without seeing error page
2. **Automatic Setup:** Organization created without user action
3. **Immediate Access:** Users can create projects right away
4. **OrganizationSwitcher Works:** Component renders without errors

## Implementation Checklist

- [ ] Enable Organizations in Clerk Dashboard
- [ ] Configure organization creation settings
- [ ] Create webhook endpoint
- [ ] Test with new user signup
- [ ] Verify OrganizationSwitcher renders
- [ ] Update middleware to check org membership
- [ ] Document in ADR

## MVP Scope

**In Scope:**
- Basic organization creation
- User as sole owner
- Default naming convention
- OrganizationSwitcher component

**Out of Scope:**
- Team invitations
- Multiple organizations per user
- Organization settings page
- Custom organization metadata

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Webhook fails | Fallback: Check on login and create if missing |
| Rate limiting | Use Clerk's built-in rate limiting |
| Duplicate orgs | Check for existing org before creating |

## References

- [Teams-Accounts.md](../../02%20Areas/Product-Specification/Teams-Accounts.md)
- [Clerk Organizations Docs](https://clerk.com/docs/organizations/overview)
- [ADR-017: Organization Architecture](../../02%20Areas/Product-Specification/05-architecture-decisions/17-organization-architecture.md)