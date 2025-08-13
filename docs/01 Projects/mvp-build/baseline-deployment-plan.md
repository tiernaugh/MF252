# Baseline next-forge Deployment Plan

**Date:** August 11, 2025  
**Goal:** Deploy working next-forge baseline before customization  
**Timeline:** Next 2-3 hours

## Why Deploy Baseline First?

1. **Verify everything works** - Catch integration issues early
2. **Create rollback point** - Can always return to working state  
3. **Test deployment pipeline** - Ensure Vercel, database, auth all connect
4. **Baseline performance** - Know what "working" looks like

## Deployment Steps (In Order)

### Phase 1: Local Setup (30 mins)

#### 1. Install Dependencies
```bash
cd many-futures
pnpm install
```

#### 2. Create Environment Files
```bash
# Create local env files
cp apps/app/.env.example apps/app/.env.local
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env.local
cp packages/database/.env.example packages/database/.env
```

#### 3. Set Minimal Environment Variables
For baseline, we only need:
```bash
# packages/database/.env and apps/app/.env.local
DATABASE_URL="[from-supabase]"
DIRECT_URL="[from-supabase]"

# apps/app/.env.local (minimum for auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="[from-clerk]"
CLERK_SECRET_KEY="[from-clerk]"
```

### Phase 2: Database Setup (30 mins)

#### 1. Create Supabase Project
- Go to supabase.com → New Project
- Region: Choose closest
- Database Password: Generate strong password
- Wait for provisioning (~2 mins)

#### 2. Get Connection Strings
- Settings → Database → Connection String
- Copy both "URI" and "Direct Connection"

#### 3. Enable pgvector
```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 4. Run Migrations
```bash
cd many-futures
pnpm migrate
```

### Phase 3: Authentication Setup (20 mins)

#### 1. Create Clerk Application
- clerk.com → Create Application
- Name: "Many Futures MVP"
- Sign-in: Email + Google initially
- Create Application

#### 2. Configure URLs
- Sign-in URL: `/sign-in`
- Sign-up URL: `/sign-up`
- After sign-in: `/`
- After sign-up: `/`

#### 3. Copy Keys
- Publishable Key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Secret Key → `CLERK_SECRET_KEY`

### Phase 4: Local Testing (20 mins)

#### 1. Start Development Server
```bash
pnpm dev
```

#### 2. Test Critical Paths
- [ ] http://localhost:3000 loads
- [ ] Can reach /sign-up
- [ ] Can reach /sign-in
- [ ] Database connects (check terminal for errors)

#### 3. Fix Any Issues
Common issues:
- Database URL format wrong
- Clerk keys incorrect
- Port conflicts

### Phase 5: Deploy to Vercel (30 mins)

#### 1. Prepare Git Repository
```bash
# Remove any sensitive files
echo "*.env*" >> .gitignore
echo ".env.local" >> .gitignore

# Commit baseline
git add .
git commit -m "chore: baseline next-forge setup ready for deployment"
git push origin main
```

#### 2. Create Vercel Project
```bash
vercel

# Questions:
# Setup and deploy? Y
# Which scope? (your-username)
# Link to existing? N
# Project name? many-futures-mvp
# Directory? ./many-futures
# Override settings? N
```

#### 3. Add Environment Variables in Vercel
1. Go to vercel.com → Project → Settings → Environment Variables
2. Add these (minimum):
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. Apply to: Production, Preview, Development

#### 4. Deploy Production
```bash
vercel --prod
```

### Phase 6: Verification (20 mins)

#### Production Checklist
- [ ] Production URL works
- [ ] /sign-up page loads
- [ ] /sign-in page loads
- [ ] Can create account
- [ ] Can sign in
- [ ] No console errors

#### Create Baseline Tag
```bash
git tag baseline-deployment-v1
git push origin baseline-deployment-v1
```

## Success Criteria

✅ **Baseline deployed** when:
1. Production URL is live
2. Authentication works (can sign up/in)
3. No critical errors in console
4. Database connected (migrations ran)
5. Git tagged for rollback

## What's NOT Needed Yet

These can wait until after baseline:
- ❌ Stripe payment setup
- ❌ Email configuration (Resend)
- ❌ Analytics (PostHog/Vercel)
- ❌ Sentry error tracking
- ❌ CMS setup
- ❌ AI API keys

## Lessons Learned (Aug 12, 2025)

### Environment Variable Validation
**Problem:** Server won't start - "Invalid environment variables"
**Root Cause:** next-forge uses strict zod validation with pattern matching
**Solution:** Use placeholders that match expected patterns:

```env
# Pattern requirements discovered:
CLERK_WEBHOOK_SECRET="whsec_placeholder"     # Must start with whsec_
RESEND_TOKEN="re_placeholder"                # Must start with re_
STRIPE_SECRET_KEY="sk_test_placeholder"      # Must start with sk_
ARCJET_KEY="ajkey_placeholder"               # Must start with ajkey_
SVIX_TOKEN="sk_svix_placeholder"            # Must start with sk_
LIVEBLOCKS_SECRET="sk_placeholder"          # Must start with sk_
POSTHOG_KEY="phc_placeholder"               # Must start with phc_
GA_MEASUREMENT_ID="G-PLACEHOLDER"           # Must start with G-
```

### Minimal Viable Configuration
Only 4 environment variables actually required:
1. DATABASE_URL (Supabase connection string)
2. DIRECT_URL (Supabase direct connection)
3. CLERK_SECRET_KEY
4. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

Everything else can use placeholders!

### Time Saved
- Expected: 3-4 hours configuring all services
- Actual: 30 minutes with placeholders
- Services to configure later when needed

## Troubleshooting

### If Deployment Fails

1. **Check Build Logs**
   - Vercel dashboard → Functions → Logs
   - Look for missing env vars
   - Check for build errors

2. **Common Fixes**
   ```bash
   # Clear and rebuild
   rm -rf .next node_modules
   pnpm install
   pnpm build
   ```

3. **Environment Variables**
   - Ensure no quotes in Vercel env vars
   - Check for typos in variable names
   - Verify all required vars are set

### If Auth Doesn't Work

1. Check Clerk Dashboard → Logs
2. Verify redirect URLs match deployment URL
3. Check middleware.ts has correct matcher

### If Database Fails

1. Test connection locally first
2. Verify Supabase project is active
3. Check connection pooling settings

## Next Steps After Baseline

Once baseline is deployed and working:

1. **Immediate** (Today):
   - Set up remaining services (Stripe, Resend)
   - Configure production environment variables

2. **Tomorrow** (Day 2):
   - Port conversational UI from prototype
   - Implement TokenUsage table
   - Add cost controls

3. **Day 3**:
   - Episode generation with safety
   - Scheduling system
   - Admin overrides

---

**Remember:** This baseline is our safety net. Tag it, document it, and we can always roll back to it if needed.