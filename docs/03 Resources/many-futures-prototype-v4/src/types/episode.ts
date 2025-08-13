// ========= TOP-LEVEL EPISODE STRUCTURE =========

export interface Episode {
  id: string; // e.g., "ep_t1o2p3q4"
  title: string;
  subtitle: string;
  project: {
    id: string; // e.g., "proj_s5t6u7v8"
    name: string;
  };
  accessControl: {
    type: 'user' | 'team';
    id: string;
  }[];
  metadata: {
    episodeNumber: number;
    publicationTimestamp: string; // ISO 8601 format: "2025-08-01T14:30:00Z"
    readingTimeMinutes: number;
    generationMetrics: {
      agentId: string; // e.g., "futura-v1.2"
      startTime: string; // ISO 8601
      endTime: string; // ISO 8601
      durationMs: number;
      costUsd: number;
      modelsUsed: string[]; // e.g., ["claude-3-opus-20240229"]
      promptTemplateVersion?: string; // Optional: e.g., "v1.2"
      memoryLinkage?: string[]; // Optional: e.g., ["mem_abc", "mem_def"]
    };
  };
  content: ContentBlock[];
  researchPlanning: ResearchPlanning;
  episodeFeedback: EpisodeFeedback;
}

// ========= CONTENT BLOCK DEFINITIONS =========

export type ContentBlock =
  | ColdOpenBlock
  | ExecutiveSummaryBlock
  | SectionHeaderBlock
  | TextBlock
  | SignalBlock
  | PatternBlock
  | PossibilityBlock
  | QuestionBlock
  | TensionBlock
  | TimingBlock
  | QuoteBlock
  | ImageBlock;

interface BaseBlock {
  id: string; // e.g., "blk_a1b2c3d4"
  type: string;
  order: number; // e.g., 10, 20, 30
  // Optional research citations associated with this block (user-visible provenance)
  citations?: Citation[];
}

export interface ColdOpenBlock extends BaseBlock {
  type: "coldOpen";
  content: {
    paragraphs: string[];
  };
}

export interface ExecutiveSummaryBlock extends BaseBlock {
  type: "executiveSummary";
  content: {
    title: string;
    points: string[];
  };
}

export interface SectionHeaderBlock extends BaseBlock {
  type: "sectionHeader";
  content: {
    title: string;
  };
}

export interface TextBlock extends BaseBlock {
  type: "text";
  content: {
    paragraphs: string[];
  };
}

export interface SignalBlock extends BaseBlock {
  type: "signal";
  content: {
    paragraphs: string[];
    source: {
      text: string;
      url: string;
    };
  };
}

export interface PatternBlock extends BaseBlock {
  type: "pattern";
  content: {
    paragraphs: string[];
    keyTakeaway?: string; // Optional
  };
}

export interface PossibilityBlock extends BaseBlock {
  type: "possibility";
  content: {
    paragraphs: string[];
    keyTakeaway?: string; // Optional
  };
}

export interface QuestionBlock extends BaseBlock {
  type: "question";
  content: {
    title?: string; // Optional title for a list of questions
    questions: string[];
  };
}

export interface TensionBlock extends BaseBlock {
  type: "tension";
  content: {
    paragraphs: string[];
    keyTakeaway?: string; // Optional
  };
}

export interface TimingBlock extends BaseBlock {
  type: "timing";
  content: {
    paragraphs: string[];
  };
}

// New: Quote block for pull‑quotes / emphasis
export interface QuoteBlock extends BaseBlock {
  type: "quote";
  content: {
    text: string;
    attribution?: string;
    sourceUrl?: string;
  };
}

// Unified citation shape for blocks
export interface Citation {
  index?: string; // optional display index like "[1]" or "49-1"
  sourceTitle?: string;
  url: string;
  excerpt?: string;
  publicationDate?: string; // ISO date
  credibility?: number; // 0..1 optional
}

// New: Image block (kept simple for MVP)
export interface ImageBlock extends BaseBlock {
  type: "image";
  content: {
    url: string;
    alt: string;
    caption?: string;
    credit?: string;
  };
}

// ========= FOOTER SECTION DEFINITIONS =========

export interface ResearchPlanning {
  title: string;
  paragraphs: string[];
  userPrompt: string;
}

export interface EpisodeFeedback {
  title: string;
  prompt: string;
  options: string[];
  followUpPrompt: string;
}