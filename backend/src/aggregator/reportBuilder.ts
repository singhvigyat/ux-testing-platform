import { detectConflicts } from './conflictDetector';
import { verifyIssues } from './issueVerifier';
import {
  PersonaAnalysis,
  ScreenshotSet,
  UIStructure,
  UXReport,
  VerificationResult,
  VerificationSummary,
} from '../types';

/**
 * Aggregates persona analyses into a final UX report.
 */
export async function buildReport(
  jobId: string,
  url: string,
  insights: PersonaAnalysis[],
  screenshots: ScreenshotSet,
  uiStructure: UIStructure,
): Promise<Partial<UXReport>> {
  const verificationResults = verifyIssues(insights, uiStructure);
  const {
    sanitizedInsights,
    verificationSummary,
  } = attachVerificationAndFilterInsights(insights, verificationResults);

  const conflictReport = await detectConflicts(sanitizedInsights);
  const conflicts = conflictReport.conflicts;
  const majorIssues = extractMajorIssues(sanitizedInsights);
  const recommendations: string[] = []; // Not implemented yet
  const summary = `Generated analysis across ${sanitizedInsights.length} personas and found ${conflictReport.totalConflicts} cross-persona conflicts.`;
  const severityScore = computeOverallSeverity(sanitizedInsights);

  if (verificationSummary.elementNotFound > 0) {
    const removedIds = verificationResults
      .filter((result) => result.verdict === 'element_not_found')
      .map((result) => `${result.personaId}:${result.issueElementId}`);
    console.warn(
      `[Verifier] Removed ${verificationSummary.elementNotFound} hallucinated issue(s): ${removedIds.join(', ')}`,
    );
  }

  if (verificationSummary.removedIssueRatio > 0.2) {
    const percent = (verificationSummary.removedIssueRatio * 100).toFixed(1);
    console.warn(
      `[Verifier] Warning: ${percent}% of issues were removed as element_not_found. Persona agents may be hallucinating IDs.`,
    );
  }

  return {
    jobId,
    url,
    screenshots,
    personaInsights: sanitizedInsights,
    conflicts,
    conflictReport,
    summary,
    majorIssues,
    recommendations,
    verificationResults,
    verificationSummary,
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

function attachVerificationAndFilterInsights(
  insights: PersonaAnalysis[],
  verificationResults: VerificationResult[],
): {
  sanitizedInsights: PersonaAnalysis[];
  verificationSummary: VerificationSummary;
} {
  const resultsByPersonaAndElement = new Map<string, VerificationResult[]>();

  for (const result of verificationResults) {
    const key = `${result.personaId}::${result.issueElementId}`;
    const existing = resultsByPersonaAndElement.get(key) ?? [];
    existing.push(result);
    resultsByPersonaAndElement.set(key, existing);
  }

  const sanitizedInsights = insights.map((analysis) => {
    const filteredIssues = analysis.issues.flatMap<PersonaAnalysis['issues'][number]>((issue) => {
      const key = `${analysis.personaId}::${issue.elementId}`;
      const queue = resultsByPersonaAndElement.get(key) ?? [];
      const verification = queue.shift();

      if (!verification) {
        return [{
          ...issue,
          verification: {
            verdict: 'unverified',
            evidence: '',
            note: 'No verifier record found. Kept as non-blocking subjective issue.',
          },
        }];
      }

      if (verification.verdict === 'element_not_found') {
        return [];
      }

      return [{
        ...issue,
        verification: {
          verdict: verification.verdict,
          evidence: verification.evidence,
          note: verification.note,
        },
      }];
    });

    return {
      ...analysis,
      issues: filteredIssues,
    };
  });

  const totalIssueCount = insights.reduce((count, analysis) => count + analysis.issues.length, 0);
  const verified = verificationResults.filter((result) => result.verdict === 'verified').length;
  const unverified = verificationResults.filter((result) => result.verdict === 'unverified').length;
  const elementNotFound = verificationResults.filter((result) => result.verdict === 'element_not_found').length;
  const removedIssueCount = elementNotFound;
  const removedIssueRatio = totalIssueCount > 0 ? removedIssueCount / totalIssueCount : 0;

  const verificationSummary: VerificationSummary = {
    verified,
    unverified,
    elementNotFound,
    removedIssueCount,
    totalIssueCount,
    removedIssueRatio,
  };

  return { sanitizedInsights, verificationSummary };
}
