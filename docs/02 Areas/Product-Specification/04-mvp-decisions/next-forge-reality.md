# Next-forge for Many Futures MVP: What We Actually Use

## 🎯 The Reality: Strip It Down

Next-forge gives us a full monorepo with 6 apps. For MVP, we need **ONE app that works perfectly**.

### What We Keep ✅

#### 1. Main App (`apps/app`)
Transform this into Many Futures:
- Clerk auth (already integrated)
- Prisma + PostgreSQL setup
- shadcn/ui components
- tRPC for API
- React Server Components

#### 2. Email Package (`apps/email`)
Keep for notifications:
- React Email templates
- "Your episode is ready" emails
- Welcome emails

#### 3. Core Packages
- `@repo/auth` - Clerk integration done
- `@repo/database` - Prisma schema starting point
- `@repo/design-system` - Beautiful components
- `@repo/ai` - Maybe useful for Claude integration

### What We Delete 🗑️

#### Apps to Remove
- `apps/web` - No marketing site for MVP
- `apps/docs` - No public docs yet
- `apps/storybook` - Nice but not essential
- `apps/studio` - Can use Prisma Studio directly

#### Packages to Ignore
- `@repo/cms` - No BaseHub needed
- `@repo/payments` - Wait, might keep for Stripe...
- Analytics packages - Add PostHog directly to main app

### What We Modify 🔧

#### 1. Simplify Database Schema
```prisma
// Start fresh with our MVP schema
model User {
  id        String   @id // Clerk ID
  email     String   @unique
  projects  Project[]
  createdAt DateTime @default(now())
}

model Project {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  title       String
  topic       String
  context     Json      // Onboarding responses
  episodes    Episode[]
  createdAt   DateTime  @default(now())
}

// etc...
```

#### 2. Rip Out Unnecessary Routes
- Remove team switching
- Remove organization management  
- Remove billing pages (add simple Stripe later)
- Keep only: Onboarding → Episodes → Settings

#### 3. Simplify Environment Variables
```env
# Just what we need for MVP
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=
ANTHROPIC_API_KEY=
PERPLEXITY_API_KEY=
RESEND_API_KEY=
```

---

## The Honest Starting Point

### Day 1 Reality
```bash
# Clone next-forge
npx next-forge@latest init --name many-futures --package-manager pnpm

# Delete what we don't need
rm -rf apps/web apps/docs apps/storybook
rm -rf packages/cms

# Focus on apps/app
cd apps/app

# Start fresh with our schema
rm prisma/schema.prisma
# Create our MVP schema

# Gut the routes we don't need
rm -rf app/(dashboard)/team
rm -rf app/(dashboard)/settings/billing
```

### Week 1 Focus
1. **Auth Works** - Clerk is pre-integrated, just configure
2. **Database Ready** - Replace their schema with ours
3. **Email Sends** - Use their React Email setup
4. **Basic Routes** - Onboarding → Dashboard → Episode

### What Makes This Faster
- **Skip the boilerplate** - Auth, database, email already connected
- **Component library ready** - shadcn/ui looks good out of the box
- **TypeScript configured** - No setup decisions needed
- **Deployment ready** - Vercel configuration done

### What Might Slow Us Down
- **Removing complexity** - Might be faster to start fresh?
- **Understanding their patterns** - Learning curve on their structure
- **Package dependencies** - Monorepo adds complexity

---

## Recommendation: Selective Adoption

### Use next-forge for:
✅ Initial project structure  
✅ Auth setup (Clerk)  
✅ Database configuration  
✅ Component library  
✅ TypeScript config  

### Build fresh for:
🔨 Onboarding flow (our unique 4-turn conversation)  
🔨 Episode rendering (our block system)  
🔨 AI integration (our n8n + Claude pipeline)  
🔨 Business logic (all custom)  

### The Real Plan
1. Init next-forge
2. Delete 70% of it
3. Keep the 30% that saves us time
4. Build our MVP on that foundation

This is faster than starting from scratch, but only if we're ruthless about removing complexity. 