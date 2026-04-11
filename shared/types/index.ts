/**
 * Re-exports all types for convenient import within the backend.
 * These types are also mirrored in shared/types/index.ts for the frontend.
 */

export type Viewport = 'desktop' | 'tablet' | 'mobile';

export type Persona = {
  id: string;
  name: string;
  age: number;
  background: string;
  goals: string[];
  painPoints: string[];
  traits: {
    readingSpeed: 'slow' | 'fast' | 'medium';
    visionAcuity: 'reduced' | 'normal' | 'high';
    techFamiliarity: 'low' | 'medium' | 'high';
    attentionSpan: 'short' | 'medium' | 'long';
    errorTolerance: 'low' | 'medium' | 'high';
  };
  heuristics: string[];
};

export type UXIssue = {
  elementId: number;           // must match an ID in the UI Structure JSON
  elementDescription: string;  // brief description of what the element is
  section: string;             // section the element belongs to
  heuristic: string;           // which heuristic this violates
  observation: string;         // what the persona noticed (1-2 sentences, first person)
  impact: string;              // why this matters for this persona specifically
  severity: "low" | "medium" | "high" | "critical";
  recommendation: string;      // one concrete fix
};

export type PersonaAnalysis = {
  personaId: string;
  personaName: string;
  viewport: Viewport;
  reasoning: string;           // 2-4 sentences of thinking before issues list (chain-of-thought)
  issues: UXIssue[];
  positives: string[];         // 1-3 things this persona found easy or good
  overallScore: number;        // 1-10, this persona's experience rating
};

export interface UXConflict {
  topic: string;
  personaA: string;
  personaB: string;
  perspectiveA: string;
  perspectiveB: string;
}

export interface ScreenshotSet {
  desktop: string;
  mobile: string;
  tablet: string;
}

export type JobStatus = 'pending' | 'processing' | 'complete' | 'error';

export interface UXReport {
  jobId: string;
  url: string;
  status: JobStatus;
  screenshots: ScreenshotSet;
  personaInsights: PersonaAnalysis[];
  conflicts: UXConflict[];
  summary: string;
  majorIssues: string[];
  recommendations: string[];
  severityScore: number;
  analysisTime: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AnalyzeRequest {
  url: string;
}

export interface AnalyzeResponse {
  jobId: string;
  message: string;
}

export interface UIStructure {
  viewport: string;
  elements: {
    id: number;
    tag: string;
    text: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    section: string;
  }[];
  sections: Record<string, number[]>;
}
