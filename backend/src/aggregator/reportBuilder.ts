import { PersonaAnalysis, UXConflict, UXReport, ScreenshotSet } from '../types';

/**
 * Aggregates persona analyses into a final UX report.
 * Detects conflicts, extracts major issues, and builds recommendations.
 */
export function buildReport(
  jobId: string,
  url: string,
  insights: PersonaAnalysis[],
  screenshots: ScreenshotSet,
): Partial<UXReport> {
  const conflicts = detectConflicts(insights);
  const majorIssues = extractMajorIssues(insights);
  const recommendations = generateRecommendations(insights, conflicts);
  const summary = generateSummary(url, insights, conflicts);
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

/**
 * Detects conflicts between personas:
 * A conflict occurs when one persona rates something positively
 * while another rates the same topic negatively.
 */
function detectConflicts(insights: PersonaAnalysis[]): UXConflict[] {
  const conflicts: UXConflict[] = [];

  // Conflict pattern: one persona has a topic as a positive, another has it as a confusion/issue
  const conflictTopics = [
    { keywords: ['navigation', 'menu', 'nav'], topic: 'Navigation & Menu Structure' },
    { keywords: ['button', 'cta', 'action', 'click'], topic: 'Call-to-Action Discoverability' },
    { keywords: ['font', 'text', 'readab', 'size'], topic: 'Text Readability' },
    { keywords: ['layout', 'structure', 'design'], topic: 'Page Layout & Structure' },
    { keywords: ['color', 'contrast', 'visual'], topic: 'Visual Design & Contrast' },
    { keywords: ['load', 'speed', 'performance'], topic: 'Perceived Performance' },
    { keywords: ['content', 'language', 'jargon', 'technical'], topic: 'Content & Language Clarity' },
    { keywords: ['mobile', 'responsive', 'touch'], topic: 'Mobile Experience' },
  ];

  for (const { keywords, topic } of conflictTopics) {
    const positivePersonas: { persona: string; observation: string }[] = [];
    const negativePersonas: { persona: string; issue: string }[] = [];

    for (const insight of insights) {
      // Check if this persona found it positive
      const positive = insight.positiveObservations.find((obs) =>
        keywords.some((kw) => obs.toLowerCase().includes(kw)),
      );
      if (positive) {
        positivePersonas.push({ persona: insight.persona, observation: positive });
      }

      // Check if this persona found it negative
      const negativeIssue = [
        ...insight.usabilityIssues,
        ...insight.confusionPoints,
        ...insight.accessibilityIssues,
      ].find((issue) => keywords.some((kw) => issue.toLowerCase().includes(kw)));

      if (negativeIssue) {
        negativePersonas.push({ persona: insight.persona, issue: negativeIssue });
      }
    }

    // A conflict exists if the same topic has both positive and negative assessments
    if (positivePersonas.length > 0 && negativePersonas.length > 0) {
      conflicts.push({
        topic,
        personaA: positivePersonas[0].persona,
        personaB: negativePersonas[0].persona,
        perspectiveA: positivePersonas[0].observation,
        perspectiveB: negativePersonas[0].issue,
      });
    }
  }

  return conflicts;
}

/**
 * Extracts the most critical issues across all personas
 * (issues appearing in 2+ personas, or critical accessibility issues)
 */
function extractMajorIssues(insights: PersonaAnalysis[]): string[] {
  const issueCounts = new Map<string, number>();

  // Count how many personas flagged similar issues
  for (const insight of insights) {
    const allIssues = [
      ...insight.usabilityIssues,
      ...insight.accessibilityIssues,
      ...insight.confusionPoints,
    ];

    for (const issue of allIssues) {
      // Normalize issue text for deduplication
      const normalized = issue.toLowerCase().slice(0, 60);
      issueCounts.set(normalized, (issueCounts.get(normalized) || 0) + 1);
    }
  }

  // Prioritize: accessibility issues always major + high-severity persona concerns
  const majorIssues: string[] = [];

  // Add all accessibility issues from high-severity personas
  for (const insight of insights) {
    if (insight.severityScore >= 7) {
      for (const issue of insight.usabilityIssues.slice(0, 2)) {
        if (!majorIssues.includes(issue)) majorIssues.push(issue);
      }
    }
    for (const issue of insight.accessibilityIssues.slice(0, 2)) {
      if (!majorIssues.includes(issue)) majorIssues.push(issue);
    }
  }

  return majorIssues.slice(0, 8); // Cap at 8 major issues
}

/**
 * Generates actionable recommendations based on findings
 */
function generateRecommendations(insights: PersonaAnalysis[], conflicts: UXConflict[]): string[] {
  const recommendations: string[] = [];

  // Recommendations based on conflicts
  for (const conflict of conflicts) {
    recommendations.push(
      `Address the ${conflict.topic} discrepancy: consider progressive disclosure or user onboarding to serve both ${conflict.personaA} and ${conflict.personaB} needs.`,
    );
  }

  // Recommendations based on common issues
  const hasAccessibilityIssues = insights.some((i) => i.accessibilityIssues.length > 0);
  if (hasAccessibilityIssues) {
    recommendations.push('Run a formal WCAG 2.1 AA accessibility audit and implement high-contrast mode and screen reader support.');
  }

  const elderlyPersona = insights.find((i) => i.personaId === 'elderly-user');
  if (elderlyPersona && elderlyPersona.severityScore >= 6) {
    recommendations.push('Increase font sizes to minimum 16px body text and ensure all interactive elements are at least 44×44px touch targets.');
  }

  const devPersona = insights.find((i) => i.personaId === 'developer-user');
  if (devPersona && devPersona.confusionPoints.length > 0) {
    recommendations.push('Improve technical documentation discoverability — add prominent links to API docs, SDKs, and quickstart guides above the fold.');
  }

  const firstTimePersona = insights.find((i) => i.personaId === 'first-time-visitor');
  if (firstTimePersona && firstTimePersona.confusionPoints.length > 0) {
    recommendations.push('Clarify your value proposition in the hero section — new visitors should understand what the product does within 5 seconds of landing.');
  }

  // Generic high-value recommendations
  if (insights.some((i) => i.severityScore >= 7)) {
    recommendations.push('Consider conducting real user testing sessions with participants matching your target demographics.');
  }

  return recommendations.slice(0, 6);
}

/**
 * Generates a natural language summary
 */
function generateSummary(url: string, insights: PersonaAnalysis[], conflicts: UXConflict[]): string {
  const avgScore = computeOverallSeverity(insights);
  const domain = new URL(url).hostname;
  const conflictCount = conflicts.length;
  const totalIssues = insights.reduce(
    (sum, i) => sum + i.usabilityIssues.length + i.accessibilityIssues.length + i.confusionPoints.length,
    0,
  );

  const severity =
    avgScore <= 3 ? 'generally positive' : avgScore <= 6 ? 'mixed' : 'significant concerns';

  return (
    `Analysis of ${domain} across ${insights.length} user personas revealed ${severity} UX results ` +
    `with an overall severity score of ${avgScore.toFixed(1)}/10. ` +
    `A total of ${totalIssues} issues were identified across all personas${conflictCount > 0 ? `, with ${conflictCount} notable conflict${conflictCount > 1 ? 's' : ''} between different user perspectives` : ''}. ` +
    `${avgScore >= 7 ? 'Immediate attention is recommended to resolve critical usability barriers.' : avgScore >= 4 ? 'Several improvements are recommended to improve the experience for diverse users.' : 'The interface performs well across most personas with minor improvements suggested.'}`
  );
}

/**
 * Computes overall severity as weighted average
 * (weights accessibility/elderly issues more heavily)
 */
function computeOverallSeverity(insights: PersonaAnalysis[]): number {
  if (insights.length === 0) return 0;
  const weights: Record<string, number> = {
    'elderly-user': 1.3,
    'visually-impaired': 1.4,
    'first-time-visitor': 1.2,
    'developer-user': 0.9,
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const insight of insights) {
    const weight = weights[insight.personaId] ?? 1.0;
    weightedSum += insight.severityScore * weight;
    totalWeight += weight;
  }

  return Math.round((weightedSum / totalWeight) * 10) / 10;
}
