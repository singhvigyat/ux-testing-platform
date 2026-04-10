// Mirror of shared/types/index.ts — kept in sync manually for frontend usage

export interface PersonaAnalysis {
  persona: string;
  personaId: string;
  usabilityIssues: string[];
  accessibilityIssues: string[];
  confusionPoints: string[];
  positiveObservations: string[];
  severityScore: number;
}

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
