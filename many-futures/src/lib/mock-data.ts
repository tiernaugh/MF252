// Mock data for UI scaffolding
// This structure represents our final database schema
// 
// KEY DESIGN DECISIONS:
// - Organizations from day 1 (even for single users) to avoid migration pain
// - Projects belong to orgs, not users directly
// - Episodes are denormalized with organizationId for query performance
// - Token usage tracked at org level for billing
// - Markdown storage for episodes (not complex blocks)

import { episode2Content, episode3Content } from "./mock-episodes";

export type User = {
  id: string;
  email: string;
  name: string;
  clerkId: string; // Clerk's user_xxx ID for auth integration
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizationType = "PERSONAL" | "TEAM";

export type Organization = {
  id: string;
  name: string; // Format: "Sarah's Workspace" for personal, actual name for teams
  type: OrganizationType;
  ownerId: string;
  clerkOrgId: string | null; // Only populated for TEAM orgs, null for PERSONAL
  createdAt: Date;
  updatedAt: Date;
};

export type CadenceType = "WEEKLY" | "BIWEEKLY" | "MONTHLY";

export type Project = {
  id: string;
  organizationId: string; // Scoping to org enables future team features
  title: string; // User-facing project name, shows in cards
  description: string; // Longer description for context
  shortSummary: string; // One-liner for quick scanning
  onboardingBrief: { // Captures the conversational onboarding with Futura
    context: string; // User's situation/role
    focusAreas: string[]; // What they want to track
    preferences: {
      tone: string; // provocative, balanced, conservative
      speculationLevel: string; // high, moderate, low
    };
    turnCount: number; // How many conversation turns to generate brief
  } | null; // Null if project created but not yet onboarded
  cadenceType: CadenceType;
  nextScheduledAt: Date | null; // When next episode will generate
  lastPublishedAt: Date | null; // When last episode was published
  isPaused: boolean; // User can pause episode generation
  createdAt: Date;
  updatedAt: Date;
};

export type EpisodeStatus = "DRAFT" | "GENERATING" | "PUBLISHED" | "FAILED";

export type Source = {
  title: string; // Source name/publication
  url: string; // Link to source (can be # for placeholder)
  publicationDate?: string; // When source was published
  excerpt?: string; // Key quote or finding from source
};

export type Episode = {
  id: string;
  projectId: string;
  organizationId: string; // Denormalized for faster org-level queries
  sequence: number; // Episode number within project (1, 2, 3...)
  title: string; // Episode headline
  summary: string; // One paragraph teaser
  highlightQuote?: string; // Pull quote for engagement
  content: string; // Full episode in Markdown (not blocks!)
  sources?: Source[]; // Array of sources cited in episode
  researchPrompt?: string; // Question/direction for next episode
  status: EpisodeStatus;
  publishedAt: Date | null; // When it went live
  readingMinutes: number; // Pre-calculated read time
  createdAt: Date;
  updatedAt: Date;
};

export type TokenUsage = {
  id: string;
  organizationId: string; // Critical for billing at org level
  projectId: string | null; // Which project triggered this usage
  episodeId: string | null; // Which episode (null for onboarding conversations)
  model: string; // gpt-4, gpt-4-turbo, claude-3-opus, etc.
  promptTokens: number;
  completionTokens: number;
  totalCost: number; // In dollars - MUST track for cost controls
  createdAt: Date;
};

// ============================================
// MOCK DATA INSTANCES
// These represent realistic data for testing
// ============================================

export const mockUser: User = {
  id: "user_1",
  email: "sarah@designconsultancy.co.uk",
  name: "Sarah Chen",
  clerkId: "user_2kFg9xQpLmN8",
  createdAt: new Date("2025-08-01"),
  updatedAt: new Date("2025-08-01"),
};

export const mockOrganization: Organization = {
  id: "org_1",
  name: "Sarah's Workspace", // Auto-created on signup as personal workspace
  type: "PERSONAL",
  ownerId: "user_1",
  clerkOrgId: null, // Personal orgs managed by our logic, not Clerk
  createdAt: new Date("2025-08-01"),
  updatedAt: new Date("2025-08-01"),
};

export const mockProjects: Project[] = [
  // Active project with published episodes - shows full feature set
  {
    id: "proj_1",
    organizationId: "org_1",
    title: "AI Impact on UK Design Consultancy",
    description: "Exploring how AI will transform design consultancies serving financial services in the UK market",
    shortSummary: "AI transformation in design consulting",
    onboardingBrief: {
      context: "15-person Edinburgh consultancy specializing in digital transformation for financial services",
      focusAreas: [
        "Client relationships and trust",
        "Regulatory compliance advantages",
        "Competitive positioning vs big consultancies",
        "New service opportunities"
      ],
      preferences: {
        tone: "provocative",
        speculationLevel: "high"
      },
      turnCount: 4
    },
    cadenceType: "WEEKLY",
    nextScheduledAt: new Date("2025-08-20"),
    lastPublishedAt: new Date("2025-08-06"),
    isPaused: false,
    createdAt: new Date("2025-08-01"),
    updatedAt: new Date("2025-08-13"),
  },
  // Paused project - user can pause/resume episode generation
  {
    id: "proj_2",
    organizationId: "org_1",
    title: "Future of Remote Work Post-2025",
    description: "Weekly intelligence on emerging remote work patterns and their impact on organizational culture",
    shortSummary: "Remote work evolution tracking",
    onboardingBrief: {
      context: "Strategy lead at a consultancy transitioning to hybrid model",
      focusAreas: [
        "Team cohesion strategies",
        "Client engagement models",
        "Talent acquisition and retention",
        "Technology infrastructure"
      ],
      preferences: {
        tone: "balanced",
        speculationLevel: "moderate"
      },
      turnCount: 3
    },
    cadenceType: "WEEKLY",
    nextScheduledAt: new Date("2025-08-21"),
    lastPublishedAt: new Date("2025-07-22"),
    isPaused: true,
    createdAt: new Date("2025-07-15"),
    updatedAt: new Date("2025-08-10"),
  },
  // New project without onboarding - shows empty state but PAUSED (active must have schedule)
  {
    id: "proj_3",
    organizationId: "org_1",
    title: "Sustainable Design Practices",
    description: "Tracking the evolution of sustainability in design and its business implications",
    shortSummary: "Sustainability in design",
    onboardingBrief: null, // Not yet onboarded
    cadenceType: "BIWEEKLY",
    nextScheduledAt: null, // Can be null because project is paused
    lastPublishedAt: null,
    isPaused: true, // Must be paused if no schedule
    createdAt: new Date("2025-08-13"),
    updatedAt: new Date("2025-08-13"),
  }
];

export const mockEpisodes: Episode[] = [
  {
    id: "ep_1",
    projectId: "proj_1",
    organizationId: "org_1",
    sequence: 1,
    title: "The Regulatory Compliance Advantage",
    summary: "How boutique consultancies may win the AI race through regulatory expertise",
    highlightQuote: "The firms most constrained by regulation today may be best positioned for AI tomorrow",
    content: `# The Regulatory Compliance Advantage

Three key discoveries emerged from this week's research into AI adoption patterns in professional services, with surprising implications for boutique consultancies like yours.

## The Compliance Speed Paradox

While large consultancies struggle with enterprise-wide AI governance, boutique firms are moving faster by treating compliance as a design constraint rather than a barrier. 

Research from MIT's Work of the Future initiative reveals that smaller firms with deep regulatory knowledge are implementing AI tools 3x faster than their larger competitors, precisely because they understand the boundaries from day one.

## Signals from the Field

**Edinburgh's Hidden Advantage**: The Scottish financial services sector's conservative approach to AI adoption is creating unexpected opportunities for specialized consultancies. Banks are specifically seeking partners who can demonstrate "compliance-first" AI integration.

**The Trust Premium**: A survey of 200 UK financial services executives shows 73% would pay a 40% premium for AI-enabled services from firms with proven regulatory track records. This "trust premium" didn't exist 18 months ago.

**Big Four Vulnerability**: Internal documents from a major consultancy (leaked to the FT) reveal they're losing mid-market financial services clients due to "AI implementation paralysis" - their global frameworks can't adapt quickly enough to UK-specific regulations.

## Strategic Implications

For your consultancy specifically, this suggests three immediate actions:

1. **Position regulatory expertise as an AI enabler**, not a brake. Your deep understanding of FCA requirements becomes your superpower in the AI age.

2. **Develop "compliance-first" AI integration frameworks** that can be deployed in weeks, not months. Small teams can prototype and iterate faster.

3. **Target firms frustrated by big consultancy AI timelines**. There's a 6-month window where boutique firms have a massive speed advantage.

## The Scenario Spectrum

**Best case (30% probability)**: Boutique consultancies capture 25% of AI transformation projects in UK financial services by positioning as the "fast and compliant" option.

**Most likely (50% probability)**: A two-tier market emerges where boutiques own rapid prototyping and compliance validation, while big firms handle enterprise-wide rollouts.

**Edge case (20% probability)**: Regulatory requirements become so complex that only specialized boutiques can navigate them, creating a new category of "regulatory AI architects."

## Your Next Move

The evidence suggests moving aggressively to claim the "compliant innovator" position before the market crystalizes. Your Edinburgh location, financial services focus, and size are perfectly aligned with this emerging opportunity.

But the window is measured in months, not years.`,
    sources: [
      {
        title: "MIT Work of the Future Initiative",
        url: "https://workofthefuture.mit.edu",
        publicationDate: "2025-07",
        excerpt: "Smaller firms with deep regulatory knowledge implementing AI 3x faster"
      },
      {
        title: "Financial Times - Big Four AI Report",
        url: "https://ft.com",
        publicationDate: "2025-07-15",
        excerpt: "Internal documents reveal AI implementation paralysis"
      },
      {
        title: "UK Financial Services Executive Survey",
        url: "#",
        publicationDate: "2025-06",
        excerpt: "73% would pay 40% premium for compliance-first AI integration"
      }
    ],
    researchPrompt: "How are boutique consultancies actually positioning their regulatory expertise as an AI differentiator?",
    status: "PUBLISHED",
    publishedAt: new Date("2025-08-06"),
    readingMinutes: 7,
    createdAt: new Date("2025-08-06"),
    updatedAt: new Date("2025-08-06"),
  },
  // Episode 2: Deep dive on AI expectations (Published)
  {
    id: "ep_2",
    projectId: "proj_1",
    organizationId: "org_1",
    sequence: 2,
    title: "When Everyone Has AI, What Are Consultancies Actually For?",
    summary: "The gap between AI access and AI strategy is creating unexpected opportunities",
    highlightQuote: "Having ChatGPT doesn't automatically translate to strategic AI implementation",
    content: episode2Content,
    sources: [
      {
        title: "McKinsey State of AI 2025",
        url: "https://mckinsey.com/ai-adoption",
        publicationDate: "2025-07",
        excerpt: "Employees using AI 3x more than executives realize"
      },
      {
        title: "Accenture Consulting Report Q2 2025",
        url: "https://accenture.com/consulting-trends",
        publicationDate: "2025-06",
        excerpt: "86% of buyers seek AI-enabled advisory, 89% expect AI in all services"
      },
      {
        title: "Gartner AI Implementation Study",
        url: "https://gartner.com/ai-failures",
        publicationDate: "2025-07",
        excerpt: "30% failure rate for AI proof-of-concept projects"
      },
      {
        title: "Deloitte Tech Trends 2025",
        url: "https://deloitte.com/tech-trends-2025",
        publicationDate: "2025-01",
        excerpt: "92% of executives boosting AI spending over next 3 years"
      },
      {
        title: "IBM AI Outlook 2025",
        url: "https://ibm.com/ai-agents",
        publicationDate: "2025-01",
        excerpt: "2025 is the year of the agent"
      }
    ],
    researchPrompt: "How are regulated industries approaching AI adoption differently than tech companies?",
    status: "PUBLISHED",
    publishedAt: new Date("2025-08-13"),
    readingMinutes: 8,
    createdAt: new Date("2025-08-13"),
    updatedAt: new Date("2025-08-13"),
  },
  // Episode 3: Client expectations shift (Draft)
  {
    id: "ep_3",
    projectId: "proj_1",
    organizationId: "org_1",
    sequence: 3,
    title: "The Great Client Expectation Shift",
    summary: "What financial services clients are actually hiring design consultancies for in the AI era",
    highlightQuote: "Clients want both AI efficiency savings and higher-value human problem-solving",
    content: episode3Content,
    sources: [
      {
        title: "Accenture Consulting Report Q2 2025",
        url: "https://accenture.com/consulting-q2-2025",
        publicationDate: "2025-06-15",
        excerpt: "86% of buyers actively seek AI-enabled advisory; 89% expect AI in services"
      },
      {
        title: "Gartner Procurement Analytics 2025",
        url: "https://gartner.com/procurement-2025",
        publicationDate: "2025-05-20",
        excerpt: "Ethical AI services +55%, explainable AI +37% in RFP language"
      },
      {
        title: "McKinsey State of AI 2025",
        url: "https://mckinsey.com/ai-reckoning-2025",
        publicationDate: "2025-04-30",
        excerpt: "2025 as AI's reckoning moment - from hype to value delivery"
      },
      {
        title: "Deloitte Consulting Evolution",
        url: "https://deloitte.com/consulting-evolution",
        publicationDate: "2025-01-18",
        excerpt: "75% of consulting firms integrating AI workflows by 2025"
      }
    ],
    researchPrompt: "How are your current clients talking about AI differently than they were six months ago?",
    status: "DRAFT",
    publishedAt: null,
    readingMinutes: 9,
    createdAt: new Date("2025-08-20"),
    updatedAt: new Date("2025-08-20"),
  },
  // Episode for Remote Work project
  {
    id: "ep_4",
    projectId: "proj_2",
    organizationId: "org_1",
    sequence: 1,
    title: "The Great Unbundling of the Office",
    summary: "How distributed work is reshaping more than just where we work",
    content: `# The Great Unbundling of the Office

The office was never just about work. It bundled together dozens of functions—social connection, mentorship, serendipitous encounters, cultural transmission, status signaling—that are now being unbundled and reformed in surprising ways.

What's emerging isn't just "remote work." It's a complete reimagining of how professional life gets organized.

## The Unbundling Pattern

According to [Microsoft's Work Trend Index](https://microsoft.com/work-trends), 73% of employees want flexible remote work options to stay. But here's what's interesting: 67% also want more in-person collaboration. That's not contradiction—it's unbundling.

People don't want the office or remote. They want specific elements of each, reassembled in new configurations.

## What's Being Unbundled

**Focus Work**: Moving to homes, coffee shops, [dedicated focus spaces](https://focusmate.com)
**Collaboration**: Shifting to intentional gatherings, quarterly offsites, project sprints
**Social Connection**: Rebuilding through virtual coffee chats, Slack communities, local coworking
**Mentorship**: Transforming into structured programs, explicit rather than osmotic
**Culture**: Becoming more documented, intentional, less reliant on physical presence

The unbundling isn't clean. Some functions work better separated. Others lose something essential when pulled apart.`,
    sources: [
      {
        title: "Microsoft Work Trend Index 2025",
        url: "https://microsoft.com/work-trends",
        publicationDate: "2025-03",
        excerpt: "73% want flexible remote options, 67% want more in-person collaboration"
      }
    ],
    researchPrompt: "Which unbundled elements of office life are companies struggling most to replicate remotely?",
    status: "PUBLISHED",
    publishedAt: new Date("2025-07-22"),
    readingMinutes: 6,
    createdAt: new Date("2025-07-22"),
    updatedAt: new Date("2025-07-22"),
  }
];

export const mockTokenUsage: TokenUsage[] = [
  {
    id: "token_1",
    organizationId: "org_1",
    projectId: "proj_1",
    episodeId: "ep_1",
    model: "gpt-4",
    promptTokens: 1500,
    completionTokens: 800,
    totalCost: 0.069,
    createdAt: new Date("2025-08-06"),
  },
  {
    id: "token_2",
    organizationId: "org_1",
    projectId: "proj_1",
    episodeId: null, // Project conversation
    model: "gpt-4",
    promptTokens: 500,
    completionTokens: 300,
    totalCost: 0.024,
    createdAt: new Date("2025-08-01"),
  },
  {
    id: "token_3",
    organizationId: "org_1",
    projectId: "proj_2",
    episodeId: "ep_3",
    model: "gpt-4",
    promptTokens: 1200,
    completionTokens: 700,
    totalCost: 0.057,
    createdAt: new Date("2025-07-22"),
  }
];

// ============================================
// HELPER FUNCTIONS
// These simulate database queries
// In production, these become tRPC procedures or server actions
// ============================================

export function getProjectsByOrg(orgId: string): Project[] {
  return mockProjects.filter(p => p.organizationId === orgId);
}

export function getEpisodesByProject(projectId: string): Episode[] {
  return mockEpisodes.filter(e => e.projectId === projectId);
}

export function getPublishedEpisodes(orgId: string): Episode[] {
  return mockEpisodes.filter(e => 
    e.organizationId === orgId && e.status === "PUBLISHED"
  );
}

export function getTotalCostByOrg(orgId: string): number {
  return mockTokenUsage
    .filter(t => t.organizationId === orgId)
    .reduce((sum, t) => sum + t.totalCost, 0);
}