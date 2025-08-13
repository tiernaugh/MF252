# ADR-016: Baseline Deployment Configuration

## Date
2025-08-12

## Status
Accepted

## Context
Successfully deployed next-forge baseline to Vercel production after resolving multiple build and routing issues. This deployment establishes our foundation for building Many Futures features.

## Decision
We have established the following deployment configuration as our baseline:

### Production URL
- Primary: https://many-futures-0725.vercel.app
- GitHub: https://github.com/tiernaugh/many-futures-0725

### Authentication Flow
- Root route (`/`) requires authentication
- Public routes: `/sign-in`, `/sign-up` only
- Clerk middleware protects all other routes
- Organizations enabled for multi-tenancy

### Database Configuration
- Supabase PostgreSQL with pgvector extension
- Prisma ORM with postinstall generation
- All Many Futures tables deployed
- TokenUsage table ready for cost tracking

### Build Configuration
- Root Directory: `apps/app`
- Build Command: Auto-detected by Vercel
- Install Command: Auto-detected (uses pnpm)
- Framework: Next.js 15 (App Router)

## Key Learnings

### 1. Prisma Client Generation
**Issue:** "Module not found: './generated/client'"
**Solution:** Add postinstall script to packages/database/package.json:
```json
"scripts": {
  "postinstall": "prisma generate --no-hints --schema=./prisma/schema.prisma"
}
```

### 2. Route Group Conflicts
**Issue:** "ENOENT: no such file or directory, lstat 'page_client-reference-manifest.js'"
**Cause:** Multiple page.tsx files handling same route in different route groups
**Solution:** Remove root page.tsx, let (authenticated)/page.tsx handle root with middleware protection

### 3. Boilerplate Code
**Issue:** References to non-existent database tables in next-forge boilerplate
**Solution:** Remove or update all boilerplate database queries before deployment

### 4. Middleware Configuration
**Issue:** Clerk middleware doesn't protect routes by default
**Solution:** Explicitly configure protected vs public routes:
```typescript
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default authMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
  return securityHeaders();
});
```

## Pre-Deployment Checklist
1. Run `pnpm build --filter=app` locally
2. Run `pnpm typecheck` in each app directory
3. Check for boilerplate code references
4. Verify environment variables match patterns
5. Test authentication flow locally

## Environment Variables
Critical variables for deployment:
- `DATABASE_URL` - Supabase connection string
- `DIRECT_URL` - Direct database connection
- `CLERK_SECRET_KEY` - Authentication
- `CLERK_PUBLISHABLE_KEY` - Client-side auth

Other services can use placeholder values initially:
- Stripe, Resend, Sentry, PostHog, etc.

## Consequences

### Positive
- Solid foundation deployed and working
- Authentication flow complete
- Database ready for features
- Clear deployment process documented
- All build issues resolved

### Negative
- Had to remove some boilerplate features
- Multiple deployment attempts needed
- Learning curve with next-forge structure

## Next Steps
1. Port conversational UI from prototype
2. Implement cost controls with TokenUsage
3. Create episode generation endpoints
4. Add payment integration

## References
- [Development Diary Entry](../../00%20Index/Development%20Diary.md#-2025-08-12-next-forge-baseline-deployment-success)
- [Vercel Deployment](https://many-futures-0725.vercel.app)
- [GitHub Repository](https://github.com/tiernaugh/many-futures-0725)