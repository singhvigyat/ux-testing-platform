import { analyzeTextWithGemini } from '../ai/visionService';
import { Conflict, ConflictReport, PersonaAnalysis, UXIssue } from '../types';

type IssueRef = {
  personaId: string;
  personaName: string;
  severity: UXIssue['severity'];
  elementDescription: string;
  section: string;
};

const severityRank: Record<UXIssue['severity'], number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function uniqueBy<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function pickMostCommon(values: string[]): string {
  if (values.length === 0) return '';

  const counts = new Map<string, number>();
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  if (counts.size === 0) return '';
  return [...counts.entries()].sort(([, a], [, b]) => b - a)[0][0];
}

function buildSeveritySummary(elementId: number, refs: IssueRef[]): string {
  const grouped = new Map<UXIssue['severity'], string[]>();

  for (const ref of refs) {
    const names = grouped.get(ref.severity) ?? [];
    names.push(ref.personaName);
    grouped.set(ref.severity, names);
  }

  const parts = [...grouped.entries()]
    .sort((a, b) => severityRank[b[0]] - severityRank[a[0]])
    .map(([severity, personas]) => `${severity} by ${uniqueBy(personas).join(', ')}`);

  return `Element ${elementId} has conflicting severity ratings: ${parts.join(' vs ')}.`;
}

function buildSeverityDesignImplication(refs: IssueRef[]): string {
  const ordered = uniqueBy(refs.map(ref => ref.severity)).sort(
    (a, b) => severityRank[a] - severityRank[b],
  );

  const lowest = ordered[0];
  const highest = ordered[ordered.length - 1];
  const spread = severityRank[highest] - severityRank[lowest];

  if (spread >= 2) {
    return 'Keep this flow, but add stronger guidance and error prevention for users who struggle, then re-test with affected personas.';
  }

  return 'Tune labels and helper cues on this element so more personas interpret it the same way before launch.';
}

export function detectSeverityConflicts(analyses: PersonaAnalysis[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const elementMap = new Map<number, IssueRef[]>();

  for (const analysis of analyses) {
    for (const issue of analysis.issues) {
      const existing = elementMap.get(issue.elementId) ?? [];
      existing.push({
        personaId: analysis.personaId,
        personaName: analysis.personaName,
        severity: issue.severity,
        elementDescription: issue.elementDescription,
        section: issue.section,
      });
      elementMap.set(issue.elementId, existing);
    }
  }

  for (const [elementId, refs] of elementMap.entries()) {
    // Collapse repeated mentions by the same persona for the same element.
    const byPersona = new Map<string, IssueRef>();
    for (const ref of refs) {
      const current = byPersona.get(ref.personaId);
      if (!current || severityRank[ref.severity] > severityRank[current.severity]) {
        byPersona.set(ref.personaId, ref);
      }
    }

    const uniquePersonaRefs = [...byPersona.values()];
    if (uniquePersonaRefs.length < 2) continue;

    const uniqueSeverities = uniqueBy(uniquePersonaRefs.map(ref => ref.severity));
    if (uniqueSeverities.length <= 1) continue;

    conflicts.push({
      elementId,
      elementDescription:
        pickMostCommon(uniquePersonaRefs.map(ref => ref.elementDescription)) || `Element ${elementId}`,
      section: pickMostCommon(uniquePersonaRefs.map(ref => ref.section)) || 'General',
      conflictType: 'severity_disagreement',
      personasInvolved: uniqueBy(uniquePersonaRefs.map(ref => ref.personaName)),
      summary: buildSeveritySummary(elementId, uniquePersonaRefs),
      designImplication: buildSeverityDesignImplication(uniquePersonaRefs),
    });
  }

  return conflicts;
}

function cleanJsonArray(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
    return cleaned;
  }

  return cleaned.slice(firstBracket, lastBracket + 1);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return uniqueBy(
    value
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.trim())
      .filter(Boolean),
  );
}

function normalizeSemanticConflict(candidate: Record<string, unknown>): Conflict {
  const elementId =
    typeof candidate.elementId === 'number' && Number.isFinite(candidate.elementId)
      ? candidate.elementId
      : null;

  const elementDescription =
    typeof candidate.elementDescription === 'string' && candidate.elementDescription.trim()
      ? candidate.elementDescription.trim()
      : elementId !== null
        ? `Element ${elementId}`
        : 'Shared interface area';

  const section =
    typeof candidate.section === 'string' && candidate.section.trim()
      ? candidate.section.trim()
      : 'General';

  const personasInvolved = toStringArray(candidate.personasInvolved);
  const people = personasInvolved.length > 0 ? personasInvolved.join(', ') : 'multiple personas';

  const summary =
    typeof candidate.summary === 'string' && candidate.summary.trim().length >= 20
      ? candidate.summary.trim()
      : `Opposing feedback appears for ${elementDescription} between ${people}.`;

  const designImplication =
    typeof candidate.designImplication === 'string' && candidate.designImplication.trim().length >= 24
      ? candidate.designImplication.trim()
      : `Validate this area with both groups and add clearer copy, cues, or optional guidance so the flow works for ${people}.`;

  return {
    elementId,
    elementDescription,
    section,
    conflictType: 'semantic_conflict',
    personasInvolved,
    summary,
    designImplication,
  };
}

function toPersonaNames(personasInvolved: string[], analyses: PersonaAnalysis[]): string[] {
  const personaNameById = new Map(analyses.map(analysis => [analysis.personaId, analysis.personaName]));
  return uniqueBy(
    personasInvolved.map(persona => personaNameById.get(persona) ?? persona).filter(Boolean),
  );
}

export async function detectSemanticConflicts(analyses: PersonaAnalysis[]): Promise<Conflict[]> {
  const stripped = analyses.map(analysis => ({
    personaId: analysis.personaId,
    personaName: analysis.personaName,
    issues: analysis.issues.map(issue => ({
      elementId: issue.elementId,
      elementDescription: issue.elementDescription,
      section: issue.section,
      severity: issue.severity,
      observation: issue.observation,
    })),
    positives: analysis.positives,
  }));

  const prompt = `
You are analyzing UX feedback from 4 different persona agents who evaluated the same webpage.

Here are their analyses:
<analyses>
${JSON.stringify(stripped, null, 2)}
</analyses>

Your task: identify conflicts where personas have meaningfully opposing views about the same UI element or area.

A conflict exists when:
- One persona lists something as a positive that another persona flags as a medium/high/critical issue
- Two personas describe the same element with opposite sentiments
- One persona finds an element easy/clear, another finds the same element confusing/problematic

Rules:
- Only flag genuine oppositions, not just different priorities
- Every conflict must name the specific personas involved
- If a conflict involves a specific elementId, include it. If it is about a general area (like navigation), set elementId to null.
- Do not invent conflicts. If the analyses genuinely agree, return an empty array.
- Keep the summary readable for non-technical product teams.
- Make designImplication concrete and actionable.

Respond ONLY with a valid JSON array. No preamble, no explanation, no markdown fences.

Schema for each conflict object:
{
  "elementId": number | null,
  "elementDescription": string,
  "section": string,
  "conflictType": "semantic_conflict",
  "personasInvolved": string[],
  "summary": string,
  "designImplication": string
}
`;

  let response = '';
  try {
    response = await analyzeTextWithGemini(prompt);
  } catch (error) {
    console.error('[ConflictDetector] Semantic conflict detection call failed:', error);
    return [];
  }

  try {
    const parsed = JSON.parse(cleanJsonArray(response)) as unknown;
    if (!Array.isArray(parsed)) {
      console.error('[ConflictDetector] Semantic conflict detection returned non-array JSON.');
      return [];
    }

    return parsed
      .filter(isObject)
      .map(normalizeSemanticConflict)
      .map(conflict => ({
        ...conflict,
        personasInvolved: toPersonaNames(conflict.personasInvolved, analyses),
      }));
  } catch {
    console.error('[ConflictDetector] Semantic conflict detection failed to parse:', response);
    return [];
  }
}

export async function detectConflicts(analyses: PersonaAnalysis[]): Promise<ConflictReport> {
  const [severityConflicts, semanticConflicts] = await Promise.all([
    Promise.resolve(detectSeverityConflicts(analyses)),
    detectSemanticConflicts(analyses),
  ]);

  const allConflicts = [...severityConflicts, ...semanticConflicts];
  const elementConflictCount = new Map<number, number>();

  for (const conflict of allConflicts) {
    if (conflict.elementId === null) continue;

    elementConflictCount.set(
      conflict.elementId,
      (elementConflictCount.get(conflict.elementId) ?? 0) + 1,
    );
  }

  const mostContestedElement =
    elementConflictCount.size > 0
      ? [...elementConflictCount.entries()].sort(([, a], [, b]) => b - a)[0][0]
      : null;

  return {
    totalConflicts: allConflicts.length,
    conflicts: allConflicts,
    mostContestedElement,
  };
}
