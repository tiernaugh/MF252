# Minimal Working Version Plan

**Date:** August 13, 2025  
**Goal:** Establish baseline functionality by stripping back to essentials

## Current Situation
- ✅ Clerk minification issue fixed with canary version
- ❌ 404 error on root route despite (authenticated)/page.tsx existing
- Build shows `ƒ /` as dynamic but route not being served
- Previous solution (removing root page.tsx) didn't work

## Step 1: Verify Build Output
```bash
# Check what's actually being built
cd many-futures && pnpm build --filter=app
```
Look for:
- Which routes are being generated
- Any warnings about route conflicts
- Confirmation that (authenticated) routes are included

## Step 2: Create Simplest Possible Root
```typescript
// apps/app/app/page.tsx (temporary test)
export default function RootPage() {
  return <div>Root works</div>;
}
```
Deploy and verify this basic page loads.

## Step 3: Test Authentication Flow
```typescript
// apps/app/app/test/page.tsx
import { auth } from '@repo/auth/server';

export default async function TestPage() {
  const { userId } = await auth();
  return (
    <div>
      <h1>Test Page</h1>
      <p>User ID: {userId || 'Not authenticated'}</p>
    </div>
  );
}
```

## Step 4: Gradually Add Complexity

### 4a. Add Basic Auth Check
```typescript
// apps/app/app/page.tsx
import { auth } from '@repo/auth/server';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  return <div>Authenticated: {userId}</div>;
}
```

### 4b. Test Route Groups
```typescript
// Remove root page.tsx
// Keep only (authenticated)/page.tsx
// Verify middleware.ts is correctly configured
```

### 4c. Add Organization Check
```typescript
// Only after basic auth works
import { auth } from '@repo/auth/server';

export default async function HomePage() {
  const { userId, orgId } = await auth();
  
  if (!userId) redirect('/sign-in');
  if (!orgId) redirect('/organization-setup');
  
  return <div>Org: {orgId}</div>;
}
```

## Step 5: Debug Middleware Configuration

Check `apps/app/middleware.ts`:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@repo/auth/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

## Step 6: Verify Route Resolution

### Check Build Output
```bash
# Look for route generation
pnpm build --filter=app 2>&1 | grep -E "Route|page"
```

### Test Direct Access
- `/` - Should load homepage
- `/sign-in` - Should load sign-in
- `/test` - Should load test page

### Check Route Conflicts
```bash
# Find all page.tsx files
find apps/app/app -name "page.tsx" -type f
```

## Step 7: Nuclear Option (If All Else Fails)

### 7a. Remove ALL route groups temporarily
```
apps/app/app/
├── page.tsx (simple authenticated homepage)
├── layout.tsx (root layout)
├── sign-in/page.tsx
└── sign-up/page.tsx
```

### 7b. Get basic routing working

### 7c. Gradually reintroduce route groups

## Implementation Order

1. **Create test page** - Verify any page loads
2. **Simple root page** - No auth, just HTML
3. **Add auth check** - Basic userId check
4. **Test route groups** - Move to (authenticated)
5. **Add org check** - Full auth flow
6. **Restore features** - Sidebar, providers, etc.

## Success Criteria

- [ ] `/test` page loads successfully
- [ ] Root `/` page loads (any content)
- [ ] Authentication redirects work
- [ ] Authenticated users see homepage
- [ ] Organization selection works
- [ ] No 404 errors on valid routes

## Common Issues to Check

1. **Middleware blocking routes**
   - Too restrictive matcher
   - Auth.protect() on public routes

2. **Route group conflicts**
   - Multiple groups handling same path
   - Incorrect nesting

3. **Build cache issues**
   - Old routes cached
   - Need force rebuild

4. **Clerk configuration**
   - Sign-in URL mismatch
   - Redirect loops

## Debug Commands

```bash
# Check running processes
lsof -i :3000

# Clear all caches
rm -rf .next
rm -rf node_modules/.cache
pnpm install

# Build with verbose output
DEBUG=* pnpm build --filter=app

# Test production build locally
pnpm build --filter=app && pnpm start --filter=app
```

## Next Actions

1. Start with Step 1 - Verify what's being built
2. Create simplest possible page that works
3. Gradually add complexity until it breaks
4. Document exactly where it fails
5. Fix that specific issue
6. Continue building up

---
*The goal is to find the minimal configuration that works, then build from there.*