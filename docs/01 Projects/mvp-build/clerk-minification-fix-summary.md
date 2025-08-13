# Clerk + Next.js 15 Minification Fix Summary

**Date:** August 13, 2025  
**Issue:** `packageName is not defined` error blocking all authenticated pages in production

## The Problem
- **Error:** Clerk's internal `packageName` variable was being mangled by Next.js 15's SWC minifier
- **Impact:** All authenticated pages showed "Oops, something went wrong"
- **Trigger:** Started after enabling Organizations in Clerk Dashboard

## The Solution That Worked
1. **Upgrade Clerk to Canary Version**
   ```bash
   pnpm add @clerk/nextjs@canary @clerk/types@canary --filter=@repo/auth
   ```
   - Upgraded to `@clerk/nextjs@6.30.2-canary.v20250812223347`
   - Canary includes minification fixes for Next.js 15

2. **Remove Duplicate Clerk Dependency**
   - Removed `@clerk/nextjs` from `apps/app/package.json`
   - Keep it only in `packages/auth/package.json`

3. **Fix Import Paths**
   - Change `import { ... } from '@clerk/nextjs'`
   - To `import { ... } from '@repo/auth/client'`

4. **Force Clean Rebuild on Vercel**
   - Add environment variable or modify file to bypass cache
   - Vercel was using cached builds from before the fix

## Current Status
✅ **FIXED** - Clerk canary version resolved the minification issue
⚠️ **404 Issue** - Root route not being served (separate issue)

## Route Group Fix (Separate Issue)
- **Problem:** Both `/app/page.tsx` and `/app/(authenticated)/page.tsx` handling `/` route
- **Solution:** Remove root `page.tsx`, let `(authenticated)` group handle root
- **Note:** Route groups don't affect URLs - `(authenticated)/page.tsx` serves `/`

## Key Learnings
1. **Canary versions often have critical fixes** - Check GitHub issues/discussions
2. **Vercel build cache can mask fixes** - Force clean builds when debugging
3. **Package duplication causes issues** - Central auth package should be single source
4. **Minification errors only appear in production** - Can't reproduce locally

## If Issue Returns
1. Check Clerk version is still canary
2. Ensure no duplicate Clerk packages
3. Force clean Vercel build
4. Consider alternatives:
   - Disable SWC minification: `swcMinify: false`
   - Downgrade to Next.js 14
   - Wait for stable Clerk release with fix

## Expert Resources
- Known issue between Clerk and Next.js 15
- Community reported fixes in canary versions
- GitHub discussions confirm this is widespread

---
*Last updated: August 13, 2025*  
*Context to preserve before clearing session*