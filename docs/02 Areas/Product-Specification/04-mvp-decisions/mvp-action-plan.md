# MVP Action Plan: Many Futures

## 🎯 The Mission
Build a futures intelligence platform that delivers such valuable strategic insights that busy professionals pay £29/month after one episode.

## 📅 4-Week Sprint to MVP

### Week 1: Foundation (Jan 27-31)
**Goal**: Auth works, database ready, emails send

#### Monday-Tuesday: Setup
- [ ] Initialize next-forge with Clerk
- [ ] Configure Supabase with MVP schema
- [ ] Set up GitHub CI/CD
- [ ] Create email templates with React Email

#### Wednesday-Thursday: Core Models  
- [ ] User registration flow
- [ ] Project creation API
- [ ] Episode storage structure
- [ ] Interaction tracking

#### Friday: Integration
- [ ] End-to-end auth test
- [ ] Database migrations working
- [ ] Email sending verified
- [ ] Deploy to Vercel preview

### Week 2: Content Pipeline (Feb 3-7)
**Goal**: Episodes generate and look beautiful

#### Monday-Tuesday: Onboarding
- [x] Conversation UI component ✅ Complete
- [x] 2-3 turn flow implementation ✅ Complete with GPT-5
- [x] Project brief generation ✅ Complete
- [ ] Context storage (database persistence)

#### Wednesday-Thursday: n8n + AI
- [ ] n8n research workflow
- [ ] Perplexity integration
- [ ] Claude episode generation
- [ ] Cost tracking

#### Friday: Episode Display
- [ ] Episode page layout
- [ ] Block components (8 types)
- [ ] Mobile responsiveness
- [ ] Typography polish

### Week 3: Engagement (Feb 10-14)
**Goal**: Users can rate blocks and guide their agent

#### Monday-Tuesday: Interactions
- [ ] Block rating UI
- [ ] Rating persistence
- [ ] Episode feedback form
- [ ] Next direction selector

#### Wednesday-Thursday: Memory
- [ ] Basic preference learning
- [ ] Episode-to-episode context
- [ ] Personalization engine
- [ ] Research progress page

#### Friday: Polish
- [ ] Loading states
- [ ] Error handling
- [ ] Performance optimization
- [ ] Cross-browser testing

### Week 4: Launch Prep (Feb 17-21)
**Goal**: Ready for first paid users

#### Monday-Tuesday: Payments
- [ ] Stripe integration
- [ ] Subscription management
- [ ] Paywall implementation
- [ ] Receipt emails

#### Wednesday-Thursday: Production
- [ ] Security audit
- [ ] Performance testing
- [ ] Error monitoring (Sentry)
- [ ] Analytics (PostHog)

#### Friday: Launch!
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Support email
- [ ] Go live! 🚀

---

## 📊 Success Criteria

### Technical Milestones
- Episode generation: <30 minutes
- Page load: <2 seconds
- Error rate: <1%
- Uptime: >99%

### User Milestones  
- 10 beta users by end of Week 3
- 50% convert to paid after Episode 1
- 80% complete first episode
- 30% rate at least one block

### Business Milestones
- £0.50 cost per episode
- £29 monthly price validated
- 5 paying customers Week 4
- 70% retain after 30 days

---

## 🚫 What We're NOT Building

### Definitely Not in MVP
- ❌ Sidebar chat
- ❌ Multiple projects
- ❌ Custom cadence
- ❌ Team features
- ❌ API access
- ❌ Advanced memory UI

### Validate First
- 📊 "Chat coming soon" fake door
- 📊 Multiple project demand
- 📊 Cadence preferences
- 📊 Export needs

---

## 🎨 Design Principles

### Episode Reading
- **Beautiful typography** - Premium feel
- **Clear block types** - Instant recognition
- **Mobile-first** - Perfect on phones
- **Fast interactions** - Sub-100ms ratings

### Onboarding
- **Conversational** - Feels like hiring someone
- **Quick** - Under 5 minutes
- **Clear** - User knows what happens next
- **Valuable** - First episode proves worth

---

## 🔧 Tech Stack (Locked)

### Frontend
- Next.js 14 (app router)
- Tailwind + shadcn/ui
- Clerk authentication
- React Email

### Backend
- Supabase (PostgreSQL)
- tRPC (typesafe API)
- n8n (workflow engine)
- Anthropic Claude

### Infrastructure
- Vercel (hosting)
- GitHub (code + CI/CD)
- Sentry (errors)
- PostHog (analytics)

---

## 📝 Next Actions

### Immediate (This Week)
1. Create "MVP Build" project in Task Master
2. Set up development environment
3. Initialize next-forge project
4. Configure Clerk + Supabase

### Pre-Development
1. Design episode page mockup
2. Write sample onboarding dialogue
3. Create n8n workflow sketch
4. Draft email templates

### Validation
1. Generate 5 sample episodes
2. Test with target users
3. Refine block types
4. Validate £29 price point

---

## 🤔 Open Decisions

### Need This Week
1. Domain name (manyfutures.ai?)
2. Email provider (Resend vs SendGrid?)
3. Exact onboarding questions
4. Block type visual design

### Can Defer
1. Exact paywall timing
2. Memory architecture details
3. Research source priorities
4. Episode length targets

---

## 💡 Remember

**The goal isn't to build everything.**  
**The goal is to prove people will pay for strategic futures intelligence.**

Ship fast. Learn faster. Iterate based on data, not assumptions. 