# User Journey Flows for UI Implementation

## Overview
These journey flows map the exact user paths through the MVP, showing screens, interactions, and decision points. Use these to build your UI scaffolding.

---

## Journey 1: First-Time User Onboarding

### Flow Diagram
```
Landing Page → Sign Up → Personal Org Created → Empty Dashboard → Create First Project → Episode Generation → Wait State → Email Notification → Read First Episode
```

### Screen-by-Screen

#### 1.1 Landing Page (`/`)
```
┌─────────────────────────────────────────┐
│      Many Futures                       │
│                                         │
│  Your AI-powered strategic              │
│  intelligence, delivered weekly         │
│                                         │
│  [Get Started]  [Sign In]               │
└─────────────────────────────────────────┘
```
**Actions:**
- Click "Get Started" → Sign up flow
- Click "Sign In" → Sign in flow

#### 1.2 Sign Up (`/sign-up`)
```
┌─────────────────────────────────────────┐
│  Create your account                    │
│                                         │
│  [Continue with Google]                 │
│  [Continue with Apple]                  │
│                                         │
│  ─────── or ──────                     │
│                                         │
│  Email: [___________]                   │
│  Password: [___________]                │
│                                         │
│  [Sign Up]                              │
│                                         │
│  Have an account? Sign in               │
└─────────────────────────────────────────┘
```
**Backend Actions:**
- Create User record
- Create personal Organization
- Link User to Organization as OWNER

#### 1.3 Empty Dashboard (`/projects`)
```
┌─────────────────────────────────────────┐
│  Welcome to Many Futures                │
│                                         │
│  You don't have any projects yet.       │
│  Let's create your first one!           │
│                                         │
│  [Create Your First Project]            │
│                                         │
└─────────────────────────────────────────┘
```
**State:** No projects exist

#### 1.4 New Project Conversation (`/projects/new`)
```
┌─────────────────────────────────────────┐
│  Create New Project                     │
│ ┌─────────────────────────────────────┐ │
│ │ 🤖 Hi! I'm Futura, your futures     │ │
│ │    research agent. What future are  │ │
│ │    you curious about?               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Type your message...        ] [Send]   │
└─────────────────────────────────────────┘
```

**Conversation Flow (3-4 turns):**

**Turn 1:**
- User: "I want to understand how AI will impact my design consultancy"
- Futura: "That's a great area to explore! To help me research the right signals for you, could you tell me a bit about your consultancy? What industry do you serve and roughly how big is your team?"

**Turn 2:**
- User: "We're 15 people in Edinburgh, mainly serving financial services"
- Futura: "Perfect! Financial services and design is a fascinating intersection. What aspects are you most curious about - client relationships, new service opportunities, competitive threats, or something else?"

**Turn 3:**
- User: "Mainly how client expectations will change and whether we'll be displaced"
- Futura: "I understand those concerns. One more question - how do you prefer your insights? More provocative scenarios that challenge thinking, or conservative analysis grounded in current trends?"

**Turn 4:**
- User: "Provocative - we need to think differently"
- Futura: "Excellent! I've got everything I need. Let me create your research brief..."

#### 1.5 Project Confirmation (`/projects/new` - final state)
```
┌─────────────────────────────────────────┐
│  Project Brief Preview                  │
│                                         │
│  📋 Here's what I'll research:          │
│                                         │
│  Project: AI Impact on UK Design        │
│          Consultancy                    │
│                                         │
│  Context:                               │
│  • 15-person Edinburgh consultancy      │
│  • Financial services focus             │
│  • Provocative scenarios preferred      │
│                                         │
│  Focus Areas:                           │
│  • Client expectation evolution         │
│  • Displacement risks & opportunities   │
│  • Competitive positioning              │
│                                         │
│  [Create Project & Start Research]      │
│  [Let me adjust something]              │
└─────────────────────────────────────────┘
```

**Actions:**
- "Create Project" → Creates project, redirects to waiting state
- "Adjust" → Returns to conversation

#### 1.6 Research in Progress (`/projects/[id]`)
```
┌─────────────────────────────────────────┐
│  AI Impact on UK Design Consultancy     │
│                                         │
│  🔬 Research in Progress                │
│                                         │
│  Futura is exploring your strategic     │
│  landscape and preparing Episode 1      │
│                                         │
│  ⏳ Estimated: 5-10 minutes             │
│                                         │
│  📧 We'll email you when ready          │
│                                         │
│  [Back to Projects]                     │
└─────────────────────────────────────────┘
```

**Backend Process:**
- Episode generation job queued
- Cost tracking active
- TokenUsage records created

---

## Journey 2: Returning User - Reading Episode

### Flow Diagram
```
Email Notification → Click Link → Episode Page → Read → Provide Feedback → (Episode 2+ Show Paywall)
```

### Screen-by-Screen

#### 2.1 Email Notification
```
Subject: 🎯 Episode 1 is ready: "The Regulatory Compliance Advantage"

Hi Sarah,

Your first episode is ready! This week I explored how regulatory 
complexity might actually be your competitive advantage.

[Read Episode 1] → Links to /episodes/[id]
```

#### 2.2 Episode Reading Page (`/episodes/[id]`)
```
┌─────────────────────────────────────────┐
│  Episode 1                              │
│  The Regulatory Compliance Advantage    │
│                                         │
│  7 min read • Aug 13, 2025              │
│                                         │
│  ─────────────────────────              │
│                                         │
│  Three key discoveries emerged from     │
│  this week's research...                │
│                                         │
│  ## The Compliance Speed Paradox        │
│                                         │
│  While large consultancies struggle...  │
│                                         │
│  [Content continues...]                 │
│                                         │
│  ─────────────────────────              │
│                                         │
│  How was this episode?                  │
│  [1] [2] [3] [4] [5]                   │
│                                         │
│  [Any feedback?___________]             │
│                                         │
│  [Submit]                               │
└─────────────────────────────────────────┘
```

**Interactions:**
- Scroll tracking for engagement
- Rating buttons (1-5)
- Optional text feedback
- Submit stores in Feedback table

#### 2.3 Post-Feedback State
```
┌─────────────────────────────────────────┐
│  ✅ Thanks for your feedback!           │
│                                         │
│  Episode 2 will arrive next Tuesday     │
│  focusing on client procurement shifts  │
│                                         │
│  [Back to Projects] [View All Episodes] │
└─────────────────────────────────────────┘
```

---

## Journey 3: Paywall Flow (Episode 2+)

### Flow Diagram
```
Click Episode 2 → Check Subscription → No Sub? → Show Paywall → Stripe Checkout → Return to Episode
```

### Screen-by-Screen

#### 3.1 Paywall Screen (`/episodes/[id]` when not subscribed)
```
┌─────────────────────────────────────────┐
│  Episode 2: Client Expectation Shifts   │
│                                         │
│  📚 This episode is for subscribers     │
│                                         │
│  Your first episode was free. To        │
│  continue receiving weekly strategic    │
│  intelligence, upgrade to full access.  │
│                                         │
│  £29/month                              │
│  • Weekly personalized episodes         │
│  • Evolving research based on feedback  │
│  • Cancel anytime                       │
│                                         │
│  [Subscribe Now]                        │
│                                         │
│  Questions? hello@manyfutures.ai        │
└─────────────────────────────────────────┘
```

**Actions:**
- "Subscribe Now" → Stripe Checkout
- After payment → Redirect back to episode

---

## Journey 4: Mature User - Project Management

### Flow Diagram
```
Dashboard → View Projects → Select Project → View Episodes → Read Latest → Provide Feedback
```

### Screen-by-Screen

#### 4.1 Projects Dashboard (`/projects`)
```
┌─────────────────────────────────────────┐
│  Your Projects                          │
│                                         │
│  ┌──────────────┐ ┌──────────────┐      │
│  │ AI Impact    │ │ Future of    │      │
│  │ Episode 4    │ │ Remote Work  │      │
│  │ Next: Aug 20 │ │ [Paused]     │      │
│  └──────────────┘ └──────────────┘      │
│                                         │
│  [+ New Project]                        │
└─────────────────────────────────────────┘
```

#### 4.2 Project Detail (`/projects/[id]`)
```
┌─────────────────────────────────────────┐
│  AI Impact on UK Design Consultancy     │
│                                         │
│  Episodes                               │
│  ┌─────────────────────────────────┐    │
│  │ Episode 4: The Trust Equation    │    │
│  │ Aug 13 • 8 min • ⭐⭐⭐⭐⭐        │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Episode 3: Boutique Advantages   │    │
│  │ Aug 6 • 7 min • ⭐⭐⭐⭐          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Project Settings]                     │
└─────────────────────────────────────────┘
```

---

## Journey 5: Admin Dashboard

### Flow Diagram
```
Admin Login → Dashboard → View Costs → Emergency Controls → User Management
```

### Screen-by-Screen

#### 5.1 Admin Dashboard (`/admin`)
```
┌─────────────────────────────────────────┐
│  Admin Dashboard                        │
│                                         │
│  Today's Costs: £12.34 / £50            │
│  Episodes Generated: 7                  │
│  Active Users: 23                       │
│                                         │
│  ⚠️ Emergency Controls                  │
│  [Pause All Generation]                 │
│  [Clear Token Cache]                    │
│                                         │
│  Recent Episodes                        │
│  • user_123: Episode 4 (£1.23)         │
│  • user_456: Episode 1 (£0.89)         │
│                                         │
│  [View All Logs]                        │
└─────────────────────────────────────────┘
```

---

## Critical User States to Handle

### 1. Loading States
```typescript
// Every async operation needs loading UI
const [isLoading, setIsLoading] = useState(false);

// Show skeleton or spinner
{isLoading ? <Skeleton /> : <Content />}
```

### 2. Error States
```typescript
// User-friendly error messages
try {
  await generateEpisode();
} catch (error) {
  if (error.code === 'COST_LIMIT_EXCEEDED') {
    showError("We've hit our daily limit. Your episode will be ready tomorrow.");
  }
}
```

### 3. Empty States
```typescript
// Guide users when no data exists
{projects.length === 0 && (
  <EmptyState
    title="No projects yet"
    description="Create your first project to start receiving weekly intelligence"
    action={{ label: "Create Project", href: "/projects/new" }}
  />
)}
```

### 4. Success States
```typescript
// Confirm actions completed
{feedbackSubmitted && (
  <Toast message="Thanks for your feedback!" />
)}
```

---

## Navigation Flow Rules

### Always Accessible
- `/projects` - Project list
- `/projects/new` - New project creation
- `/sign-out` - Sign out

### Conditional Access
- `/episodes/[id]` - Requires project ownership
- `/admin` - Requires admin role
- `/api/*` - Requires authentication

### Redirect Logic
```typescript
// After sign up → Empty dashboard or projects
// After project creation → Project detail page
// After payment → Original episode
// After sign out → Landing page
```

---

## Mobile Considerations

### Touch Targets
- Minimum 44x44px for all interactive elements
- Spacing between actions to prevent mis-taps

### Responsive Breakpoints
```css
/* Mobile: < 640px */
/* Tablet: 640px - 1024px */
/* Desktop: > 1024px */
```

### Mobile-First Patterns
1. Stack navigation vertically on mobile
2. Full-width buttons on mobile
3. Simplified episode cards
4. Bottom sheet for feedback on mobile

---

## State Management Patterns

### URL State
```typescript
// Use URL params for shareable state
/episodes/[id]?feedback=submitted
/projects/new?step=confirmation
```

### Session State
```typescript
// Use cookies/localStorage for:
- Conversation history in project creation
- Draft feedback before submission
- Reading progress in episodes
```

### Server State
```typescript
// Always fetch fresh from DB for:
- Project list
- Episode content
- Subscription status
```

---

*Use these flows to build your UI components with confidence that you're creating the right user experience.*