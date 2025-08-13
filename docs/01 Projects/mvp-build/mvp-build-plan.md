# MVP Build Plan - Many Futures

**Status:** Ready to Build  
**Timeline:** 2 Weeks (Aug 11-25, 2025)  
**Approach:** Lean with Safety Features  
**Goal:** 5 paying customers at £29/month

---

## 📁 Key Reference Documents

### Primary Roadmap
- **[production-roadmap-lean.md](./production-roadmap-lean.md)** - Active 2-week plan with safety features

### Supporting Documentation
- **[lean-pivot-rationale.md](./lean-pivot-rationale.md)** - Why we're building lean
- **[full-vision/](./full-vision/)** - Comprehensive plans preserved for future
- **[advisor-feedback-response.md](./advisor-feedback-response.md)** - Technical decisions explained

### Implementation Files
- **[/many-futures/config/features.ts](/many-futures/config/features.ts)** - Feature toggle configuration
- **[/many-futures/packages/database/prisma/schema.prisma](/many-futures/packages/database/prisma/schema.prisma)** - Full schema (ready but not all used)
- **[/many-futures-prototype-v4/server.js](/many-futures-prototype-v4/server.js)** - Working conversational UI
- **[/many-futures/packages/database/supabase/security-setup.sql](/many-futures/packages/database/supabase/security-setup.sql)** - RLS policies

---

## 🏗️ Phase 0: Foundation (Days 1-3) - Started Aug 11

### Day 1 Tasks (Aug 11) ✅
- [x] Lean pivot decision and documentation
- [x] Feature flags system created
- [x] Critical safety features identified

### Day 2 Tasks (Aug 12) ✅ COMPLETED
- [x] **Supabase Setup**
  - [x] Create project at supabase.com
  - [x] Enable pgvector extension
  - [x] Get connection strings
  - [x] Update `.env.local` with credentials

- [x] **Database Migration**
  - [x] Fixed Supabase package version (1.252.19 → 2.33.9)
  - [x] Ran `pnpm migrate` successfully
  - [x] All tables created including TokenUsage

- [x] **Cost Tracking Table**
  - [x] TokenUsage table already in schema
  - [x] Ready for cost tracking implementation

- [x] **Environment Configuration**
  - [x] All env vars configured with proper patterns
  - [x] Clerk authentication working (Apple + Google)
  - [x] Local development server running

- [x] **Deploy to Vercel Production**
  - [x] Fixed Prisma client generation with postinstall
  - [x] Resolved route group conflicts 
  - [x] Fixed boilerplate database queries
  - [x] Authentication flow working end-to-end
  - [x] Live at https://many-futures-0725.vercel.app

### Day 3 Tasks (Aug 13)
- [ ] **Port Conversational UI**
  - [ ] Port from `many-futures-prototype-v4/server.js`
  - [ ] Create Next.js API route
  - [ ] Test project creation flow

- [ ] **Cost Control Implementation**
  - [ ] Create `/app/lib/cost-controls.ts`
  - [ ] Implement daily limit check
  - [ ] Add pre-generation validation
  - [ ] Test kill switch at £50

- [ ] **Analytics Setup**
  ```bash
  cd many-futures
  pnpm add @vercel/analytics
  ```
  - [ ] Add to `app/layout.tsx`
  - [ ] Create tracking helper functions

- [ ] **Episode Scheduling**
  - [ ] Add schedule fields to Project
  - [ ] Create Vercel Cron job (`/app/api/cron/generate-episodes/route.ts`)
  - [ ] Test with one project

---

## 🚀 Phase 1: Core Value Loop (Days 4-7)

### Day 4: Episode Generation
- [ ] **Claude Integration**
  - [ ] Create `/app/lib/episode-generator.ts`
  - [ ] Port generation logic with cost tracking
  - [ ] Add token counting
  - [ ] Test with real project brief

### Day 5: Reading Experience
- [ ] **Episode Display**
  - [ ] Port typography from prototype
  - [ ] Create `/app/episodes/[id]/page.tsx`
  - [ ] Mobile responsive design
  - [ ] Track read completion

### Day 6: Feedback Collection
- [ ] **Simple Feedback Form**
  - [ ] Create feedback component
  - [ ] Store in database
  - [ ] Feed into next episode
  - [ ] Track sentiment

### Day 7: User Notifications
- [ ] **Choose & Implement One:**
  - Option A: Email via Resend
  - Option B: In-app notification badge
  - Option C: "NEW" indicator on login
- [ ] Test notification delivery

---

## 💰 Phase 2: Payment (Days 8-9)

### Day 8: Stripe Integration
- [ ] **Payment Setup**
  - [ ] Configure Stripe in next-forge
  - [ ] Create checkout flow
  - [ ] Implement paywall after Episode 1
  - [ ] Test payment processing

### Day 9: Admin Dashboard
- [ ] **Admin Controls**
  - [ ] Create `/app/admin/page.tsx` (protected)
  - [ ] Regenerate episode function
  - [ ] Refund capability
  - [ ] Pause project function
  - [ ] Cost monitoring dashboard

---

## 📈 Phase 3: Learn & Iterate (Days 10-14)

### Day 10: First Users
- [ ] **Beta Launch**
  - [ ] Onboard 5 test users
  - [ ] Monitor costs per episode
  - [ ] Track completion rates
  - [ ] Gather initial feedback

### Day 11-12: Daily Improvements
- [ ] **Based on Feedback:**
  - [ ] Fix critical bugs
  - [ ] Adjust episode prompts
  - [ ] Tweak scheduling
  - [ ] Improve notifications

### Day 13: Optimization
- [ ] **Performance & Polish**
  - [ ] Optimize database queries
  - [ ] Improve loading states
  - [ ] Error boundary implementation
  - [ ] Cost optimization

### Day 14: Launch Prep
- [ ] **Final Checks**
  - [ ] Security audit
  - [ ] Cost controls verified
  - [ ] Admin tools tested
  - [ ] First 5 paying customers

---

## 🛡️ Critical Safety Checklist

### Before ANY Episode Generation
```typescript
// Required checks in episode-generator.ts
- [ ] Cost limit not exceeded today
- [ ] Project not paused
- [ ] User has active subscription (after trial)
- [ ] Previous episode completed
```

### Daily Monitoring
```typescript
// Admin dashboard must show
- [ ] Total cost today
- [ ] Episodes generated count
- [ ] Average cost per episode
- [ ] Any errors or failures
```

### Emergency Procedures
```typescript
// Quick access admin actions
- [ ] PAUSE ALL button
- [ ] Regenerate episode
- [ ] Refund user
- [ ] Edit episode content
```

---

## 📊 Success Criteria

### Phase 0 Complete ✅
- Database live with cost tracking
- Conversational UI deployed
- Analytics capturing events
- Cost controls implemented

### Phase 1 Complete ✅
- Episodes generating <£1 each
- Beautiful reading experience
- Feedback being collected
- Users notified of new episodes

### Phase 2 Complete ✅
- Payments working end-to-end
- Admin can intervene when needed
- Costs under control

### Phase 3 Complete ✅
- 5 paying customers
- Clear #1 feature request
- Sustainable unit economics
- Ready to scale

---

## 🚫 What We're NOT Building

**Absolutely Not:**
- Chat interface (unless users demand it)
- Vector embeddings (expensive, unproven)
- Complex memory system (over-engineered)
- Multiple projects (one is enough initially)
- 8 block types (start with markdown)

**Build Only If Pulled:**
```typescript
if (users.filter(u => u.requested('chat')).length > 3) {
  FEATURES.CHAT = true;
}
```

---

## 📝 Daily Standup Questions

Every morning at 9am:
1. **What shipped yesterday?**
2. **What are today's costs?**
3. **What did users say?**
4. **What ships today?**

---

## 🔗 Quick Commands

```bash
# Start development
cd many-futures && pnpm dev --filter=app

# Check costs
pnpm exec prisma studio
# Look at TokenUsage table

# Deploy to production
git push origin main
# Vercel auto-deploys

# Run episode generation manually
curl -X POST http://localhost:3000/api/episodes/generate \
  -H "Content-Type: application/json" \
  -d '{"projectId": "..."}'

# Check analytics
# Visit: https://vercel.com/analytics
```

---

## 🎯 The North Star

**Question to ask every day:**
> "Will this help us get 5 paying customers in 2 weeks?"

If no → Don't build it.  
If maybe → Defer it.  
If yes → Ship it today.

---

*This plan is a living document. Update daily based on reality, not assumptions.*