import { PersonaAnalysis, UXConflict, UXReport, ScreenshotSet } from '../types';

/**
 * Aggregates persona analyses into a final UX report.
 */
export function buildReport(
  jobId: string,
  url: string,
  insights: PersonaAnalysis[],
  screenshots: ScreenshotSet,
): Partial<UXReport> {
  const conflicts: UXConflict[] = []; // Conflicts not implemented yet in Step 06
  const majorIssues = extractMajorIssues(insights);
  const recommendations: string[] = []; // Not implemented yet
  const summary = `Generated analysis across ${insights.length} persona.`;
  const severityScore = computeOverallSeverity(insights);

  return {
    jobId,
    url,
    screenshots,
    personaInsights: insights,
    conflicts,
    summary,
    majorIssues,
    recommendations,
    severityScore,
  };
}

function extractMajorIssues(insights: PersonaAnalysis[]): string[] {
  const issuesList: string[] = [];
  for (const insight of insights) {
    for (const issue of insight.issues) {
      issuesList.push(`[${insight.personaName}] ${issue.observation}`);
    }
  }
  return issuesList.slice(0, 8);
}

function computeOverallSeverity(insights: PersonaAnalysis[]): number {
  if (insights.length === 0) return 0;
  let totalScore = 0;
  for (const insight of insights) {
    totalScore += insight.overallScore;
  }
  return Math.round((totalScore / insights.length) * 10) / 10;
}
