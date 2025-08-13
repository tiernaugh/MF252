# API App Implementation Plan

**Status:** Ready to Implement  
**Date:** 2025-08-13  
**Timeline:** 1-2 hours  
**Purpose:** Deploy API app with organization auto-creation webhook

## Overview

Following next-forge architecture patterns, we'll deploy the API app separately to handle webhooks, cron jobs, and background tasks. This provides proper separation of concerns and scales independently from the main UI.

## Current State

### What Exists
- ✅ Webhook structure at `/apps/api/app/webhooks/auth/route.ts`
- ✅ Handler for `user.created` events (analytics only)
- ✅ Svix webhook verification configured
- ✅ Clerk types and imports ready

### What's Broken
- ❌ Keep-alive cron job references non-existent `page` table
- ❌ API app not deployed yet
- ❌ No organization creation logic in webhook

## Implementation Steps

### Step 1: Fix Boilerplate Issues (10 min)

#### File: `/apps/api/app/cron/keep-alive/route.ts`

**Current Issue:** References `database.page` which doesn't exist

**Options:**
1. **Delete entirely** (if we don't need database keep-alive)
2. **Fix to use real table** (e.g., create/delete a KeepAlive record)
3. **Comment out** (temporary until we decide)

**Recommendation:** Fix to use Organization table check:
```typescript
export const GET = async () => {
  // Simple health check instead of create/delete
  const count = await database.organization.count();
  return new Response(`OK - ${count} organizations`, { status: 200 });
};
```

### Step 2: Enhance Webhook Handler (20 min)

#### File: `/apps/api/app/webhooks/auth/route.ts`

**Add to `handleUserCreated` function (after line 33):**

```typescript
import { clerkClient } from '@repo/auth/server';

const handleUserCreated = async (data: UserJSON) => {
  // Existing analytics code...
  
  try {
    // Auto-create organization for new user
    const clerk = await clerkClient();
    
    // Create organization with user's name
    const org = await clerk.organizations.createOrganization({
      name: `${data.first_name || 'User'}'s Strategic Research`,
      createdBy: data.id,
      publicMetadata: {
        type: 'personal',
        plan: 'trial',
        createdAt: new Date().toISOString()
      }
    });
    
    // Add user as admin/owner
    await clerk.organizationMemberships.createOrganizationMembership({
      organizationId: org.id,
      userId: data.id,
      role: 'org:admin'
    });
    
    // Update user's metadata with default org
    await clerk.users.updateUser(data.id, {
      publicMetadata: {
        defaultOrgId: org.id,
        onboardingComplete: true
      }
    });
    
    // Track org creation
    analytics.capture({
      event: 'Organization Auto-Created',
      distinctId: data.id,
      properties: {
        organizationId: org.id,
        organizationName: org.name
      }
    });
    
    log.info('Organization created for user', {
      userId: data.id,
      orgId: org.id
    });
    
  } catch (error) {
    log.error('Failed to create organization', {
      userId: data.id,
      error
    });
    // Don't fail the webhook - user can still sign in
    // Middleware will catch and create org as fallback
  }
  
  return new Response('User and organization created', { status: 201 });
};
```

### Step 3: Test Locally (15 min)

```bash
# 1. Navigate to API app
cd apps/api

# 2. Check types
pnpm typecheck

# 3. Build to verify
pnpm build

# 4. Run locally
pnpm dev

# 5. Test endpoint (should return 401 without proper signature)
curl http://localhost:3002/webhooks/auth
```

### Step 4: Deploy to Vercel (15 min)

#### 4.1 Create New Vercel Project
1. Go to vercel.com/new
2. Import same GitHub repo
3. Name it: `many-futures-api`
4. **Important:** Set Root Directory to `apps/api`
5. Framework Preset: Next.js
6. Build Command: Auto-detected

#### 4.2 Environment Variables
Copy these from main app deployment:
```env
# Required
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_... (will get after webhook setup)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Optional but recommended
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
RESEND_TOKEN=re_placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_stripe_placeholder
```

#### 4.3 Deploy
- Click Deploy
- Should build successfully after boilerplate fixes

### Step 5: Configure Clerk Webhook (10 min)

1. **Go to Clerk Dashboard → Webhooks**
2. **Create Endpoint:**
   - URL: `https://many-futures-api.vercel.app/webhooks/auth`
   - Events to send:
     - ✅ user.created
     - ✅ user.updated
     - ✅ user.deleted
     - ✅ organization.created
     - ✅ organization.updated
     - ✅ organizationMembership.created
     - ✅ organizationMembership.deleted

3. **Copy Signing Secret:**
   - Will look like: `whsec_abc123...`
   - Add to Vercel env vars as `CLERK_WEBHOOK_SECRET`
   - Redeploy API app to pick up new env var

### Step 6: Add Fallback to Main App (10 min)

#### File: `/apps/app/middleware.ts`

Add organization check as safety net:

```typescript
import { clerkClient } from '@repo/auth/server';

// After auth check, before returning
if (userId && !orgId) {
  // Check if user has any organizations
  const clerk = await clerkClient();
  const memberships = await clerk.users.getOrganizationMembershipList({
    userId
  });
  
  if (memberships.totalCount === 0) {
    // Create org as fallback (webhook might have failed)
    // Redirect to simple onboarding page
    return NextResponse.redirect(new URL('/onboarding/organization', req.url));
  }
}
```

## Testing Plan

### Local Testing
1. Create test user with ngrok or similar
2. Verify webhook receives event
3. Check organization created in Clerk dashboard

### Production Testing
1. Sign up new user at many-futures-app.vercel.app
2. Check Clerk Dashboard → Users → User has organization
3. Check Clerk Dashboard → Organizations → New org exists
4. Verify OrganizationSwitcher renders without error
5. Check webhook logs in Vercel Functions tab

## Success Metrics

- ✅ API app deployed and healthy
- ✅ Webhook receives and processes events
- ✅ New users get organizations automatically
- ✅ No "Oops, something went wrong" errors
- ✅ OrganizationSwitcher works for all users

## Rollback Plan

If issues arise:
1. Disable webhook in Clerk dashboard
2. Implement temporary fix in main app middleware
3. Debug and redeploy API app
4. Re-enable webhook

## Architecture Benefits

### Why Separate API App?
1. **Isolation:** Webhooks can't crash main UI
2. **Security:** Different rate limits and authentication
3. **Scaling:** API scales independently from UI
4. **Monitoring:** Separate logs and metrics
5. **Testing:** Easier to test webhooks in isolation

### Future Use Cases
- Episode generation endpoints
- Scheduled cron jobs for weekly episodes
- Stripe payment webhooks
- Email notification triggers
- Cost tracking aggregation
- Admin operations

## Next Steps After This

1. Monitor webhook success rate
2. Add Sentry error tracking
3. Create admin dashboard to view webhook logs
4. Implement episode generation in API app
5. Add cron job for weekly episode creation

## Files to Modify

```
apps/api/
├── app/
│   ├── cron/
│   │   └── keep-alive/route.ts (fix or delete)
│   └── webhooks/
│       └── auth/route.ts (enhance handleUserCreated)
├── .env.local (add all env vars)
└── vercel.json (already configured)
```

## References

- [next-forge API Documentation](https://docs.next-forge.com/api)
- [Clerk Webhooks Guide](https://clerk.com/docs/webhooks/overview)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Organization Architecture ADR](../../02%20Areas/Product-Specification/05-architecture-decisions/17-organization-architecture.md)