// Mock data for UI scaffolding
// This structure represents our final database schema

export type User = {
  id: string;
  email: string;
  name: string;
  clerkId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizationType = "PERSONAL" | "TEAM";

export type Organization = {
  id: string;
  name: string;
  type: OrganizationType;
  ownerId: string;
  clerkOrgId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CadenceType = "WEEKLY" | "BIWEEKLY" | "MONTHLY";

export type Project = {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  shortSummary: string;
  onboardingBrief: {
    context: string;
    focusAreas: string[];
    preferences: {
      tone: string;
      speculationLevel: string;
    };
    turnCount: number;
  } | null;
  cadenceType: CadenceType;
  nextScheduledAt: Date | null;
  isPaused: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type EpisodeStatus = "DRAFT" | "GENERATING" | "PUBLISHED" | "FAILED";

export type Episode = {
  id: string;
  projectId: string;
  organizationId: string; // Denormalized for query performance
  sequence: number;
  title: string;
  summary: string;
  highlightQuote?: string;
  content: string; // Markdown
  status: EpisodeStatus;
  publishedAt: Date | null;
  readingMinutes: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TokenUsage = {
  id: string;
  organizationId: string;
  projectId: string | null;
  episodeId: string | null;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalCost: number; // In dollars
  createdAt: Date;
};

// Mock data instances
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
  name: "Sarah's Workspace",
  type: "PERSONAL",
  ownerId: "user_1",
  clerkOrgId: null, // Personal orgs don't need Clerk org ID
  createdAt: new Date("2025-08-01"),
  updatedAt: new Date("2025-08-01"),
};

export const mockProjects: Project[] = [
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
    isPaused: false,
    createdAt: new Date("2025-08-01"),
    updatedAt: new Date("2025-08-13"),
  },
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
    isPaused: true,
    createdAt: new Date("2025-07-15"),
    updatedAt: new Date("2025-08-10"),
  },
  {
    id: "proj_3",
    organizationId: "org_1",
    title: "Sustainable Design Practices",
    description: "Tracking the evolution of sustainability in design and its business implications",
    shortSummary: "Sustainability in design",
    onboardingBrief: null, // Not yet onboarded
    cadenceType: "BIWEEKLY",
    nextScheduledAt: null,
    isPaused: false,
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
    status: "PUBLISHED",
    publishedAt: new Date("2025-08-06"),
    readingMinutes: 7,
    createdAt: new Date("2025-08-06"),
    updatedAt: new Date("2025-08-06"),
  },
  {
    id: "ep_2",
    projectId: "proj_1",
    organizationId: "org_1",
    sequence: 2,
    title: "Client Expectation Shifts",
    summary: "New procurement language reveals changing client priorities in professional services",
    content: `# Client Expectation Shifts

The language in RFPs has changed. An analysis of 150 recent procurement documents from UK financial services reveals a fundamental shift in how clients think about consultancy partnerships...

[Episode content continues...]`,
    status: "DRAFT",
    publishedAt: null,
    readingMinutes: 8,
    createdAt: new Date("2025-08-13"),
    updatedAt: new Date("2025-08-13"),
  },
  {
    id: "ep_3",
    projectId: "proj_2",
    organizationId: "org_1",
    sequence: 1,
    title: "The Great Unbundling of the Office",
    summary: "How distributed work is reshaping more than just where we work",
    content: `# The Great Unbundling of the Office

The office was never just about work. It bundled together dozens of functions that are now being unbundled and reformed in surprising ways...`,
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

// Helper functions
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