# ADR-017: Organization Architecture & Auto-Creation

## Date
2025-08-13

## Status
Accepted

## Context

The Many Futures platform requires a multi-tenant architecture where users can belong to organizations. Based on the Teams-Accounts.md specification, we're implementing a "My Team" default where every user gets a personal organization automatically.

### Current Issues
1. **Production Error:** OrganizationSwitcher component fails when organizations aren't enabled
2. **User Experience:** Users shouldn't need to manually create an organization to use the app
3. **Data Scoping:** All database queries are scoped by organizationId for security

## Decision

We will implement automatic organization creation for all users with the following architecture:

### 1. Organization Model
Every user will have at least one organization:
- **Personal Organization:** Auto-created on signup
- **Name Format:** "[User's Name]'s Strategic Research"
- **Type:** Personal workspace (single member)
- **Future:** Can join/create additional organizations

### 2. Auto-Creation Flow
```mermaid
graph LR
    A[User Signs Up] --> B[Clerk Webhook]
    B --> C[Create Organization]
    C --> D[Add User as Owner]
    D --> E[Set Default Org]
    E --> F[User Ready]
```

### 3. Database Scoping
All entities are scoped by organizationId:
```typescript
// Every query includes org scope
const projects = await db.project.findMany({
  where: { 
    organizationId: orgId,
    userId: userId 
  }
});
```

### 4. Webhook Implementation
```typescript
// /api/webhooks/clerk/route.ts
export async function POST(req: Request) {
  const { type, data } = await req.json();
  
  if (type === 'user.created') {
    const org = await clerkClient.organizations.createOrganization({
      name: `${data.firstName || 'User'}'s Strategic Research`,
      createdBy: data.id,
      publicMetadata: {
        type: 'personal',
        plan: 'trial'
      }
    });
    
    // Add user as owner
    await clerkClient.organizations.addMember({
      organizationId: org.id,
      userId: data.id,
      role: 'owner'
    });
    
    // Set as default org
    await clerkClient.users.updateUser(data.id, {
      publicMetadata: {
        defaultOrgId: org.id
      }
    });
  }
}
```

### 5. Middleware Protection
```typescript
// Ensure user has organization
if (!auth.orgId) {
  // Redirect to onboarding or create org
  return NextResponse.redirect('/onboarding');
}
```

## Implementation Details

### Clerk Configuration
1. **Enable Organizations:** Required in Clerk Dashboard
2. **Roles:** owner, admin, member (future)
3. **Creation:** Members can create organizations
4. **Switching:** OrganizationSwitcher in sidebar

### Database Schema
Already includes organizationId in all tables:
- Project: `organizationId String`
- Episode: Inherits through Project
- User: Linked via Clerk's organization membership

### Security Considerations
- **RLS Policies:** All queries filtered by organizationId
- **API Routes:** Validate orgId from auth context
- **Webhooks:** Verify Clerk webhook signatures
- **Data Isolation:** Complete separation between orgs

## Consequences

### Positive
- **Immediate Access:** Users can start using app right after signup
- **Security:** Built-in data isolation between organizations
- **Scalability:** Ready for team features without migration
- **Compliance:** Multi-tenant architecture for enterprise

### Negative
- **Complexity:** Additional webhook infrastructure needed
- **Dependency:** Relies on Clerk's organization feature
- **Cost:** Organizations may affect Clerk pricing tier

### Neutral
- **Migration Path:** Existing users need organizations created retroactively
- **UI Changes:** OrganizationSwitcher always visible (even for single org)

## Alternatives Considered

### 1. No Organizations (Simple)
- **Pros:** Simpler implementation
- **Cons:** No path to team features, harder to add later
- **Rejected:** Doesn't align with product vision

### 2. Manual Organization Creation
- **Pros:** User control over organization details
- **Cons:** Friction in onboarding, confusing for single users
- **Rejected:** Poor UX for MVP

### 3. Lazy Organization Creation
- **Pros:** Create only when needed
- **Cons:** Complex state management, potential errors
- **Rejected:** More edge cases to handle

## Migration Strategy

For existing users without organizations:
1. Run migration script to create personal orgs
2. Or create on next login if missing
3. Backfill organizationId in existing records

## References

- [Organization Auto-Creation PRD](../../../01%20Projects/mvp-build/organization-auto-creation-prd.md)
- [Teams-Accounts Specification](../Teams-Accounts.md)
- [Database Schema ADR-015](./15-database-schema-final.md)
- [Clerk Organizations Documentation](https://clerk.com/docs/organizations/overview)