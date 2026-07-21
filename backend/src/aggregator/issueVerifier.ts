import { PersonaAnalysis, UIStructure, VerificationResult } from '../types';

const MIN_TAP_TARGET_SIZE = 44;
const MIN_READABLE_FONT_SIZE = 14;

const TAP_TARGET_HEURISTICS = new Set(['tap_target_size']);
const TEXT_SIZE_HEURISTICS = new Set(['text_readability', 'text_size']);
const ARIA_LABEL_HEURISTICS = new Set(['icon_labeling', 'focus_visibility']);

function normalizeHeuristic(heuristic: string): string {
  return heuristic.trim().toLowerCase().replace(/\s+/g, '_');
}

function toPxEvidence(label: string, value: number | undefined): string {
  return Number.isFinite(value) ? `${label}=${value}px` : `${label}=unknown`;
}

/**
 * Scoped verifier:
 * - Verifies only measurable DOM-backed claims.
 * - Does not evaluate subjective or reasoning-only claims.
 */
export function verifyIssues(
  analyses: PersonaAnalysis[],
  uiStructure: UIStructure,
): VerificationResult[] {
  const results: VerificationResult[] = [];
  const elementMap = new Map(uiStructure.elements.map((el) => [el.id, el]));

  for (const analysis of analyses) {
    for (const issue of analysis.issues) {
      const element = elementMap.get(issue.elementId);

      if (!element) {
        results.push({
          issueElementId: issue.elementId,
          personaId: analysis.personaId,
          verdict: 'element_not_found',
          evidence: '',
          note: `Element ID ${issue.elementId} does not exist in UI structure`,
        });
        continue;
      }

      const heuristic = normalizeHeuristic(issue.heuristic);

      if (TAP_TARGET_HEURISTICS.has(heuristic)) {
        const width = Number.isFinite(element.width) ? element.width : undefined;
        const height = Number.isFinite(element.height) ? element.height : undefined;
        const tooSmall =
          typeof width === 'number' &&
          typeof height === 'number' &&
          (width < MIN_TAP_TARGET_SIZE || height < MIN_TAP_TARGET_SIZE);

        results.push({
          issueElementId: issue.elementId,
          personaId: analysis.personaId,
          verdict: tooSmall ? 'verified' : 'unverified',
          evidence: `${toPxEvidence('width', width)}, ${toPxEvidence('height', height)}`,
          note: tooSmall
            ? `Confirmed: below ${MIN_TAP_TARGET_SIZE}px threshold`
            : `Element meets minimum size. Claim may be inaccurate.`,
        });
        continue;
      }

      if (TEXT_SIZE_HEURISTICS.has(heuristic)) {
        const fontSize = Number.isFinite(element.fontSize) ? element.fontSize : undefined;
        const tooSmall = typeof fontSize === 'number' && fontSize < MIN_READABLE_FONT_SIZE;

        results.push({
          issueElementId: issue.elementId,
          personaId: analysis.personaId,
          verdict: tooSmall ? 'verified' : 'unverified',
          evidence: toPxEvidence('fontSize', fontSize),
          note: tooSmall
            ? `Confirmed: below ${MIN_READABLE_FONT_SIZE}px readable threshold`
            : `Font size is adequate. Subjective claim not supported by data.`,
        });
        continue;
      }

      if (ARIA_LABEL_HEURISTICS.has(heuristic)) {
        const missing = element.tag === 'button' && element.ariaLabel.trim() === '';

        results.push({
          issueElementId: issue.elementId,
          personaId: analysis.personaId,
          verdict: missing ? 'verified' : 'unverified',
          evidence: `ariaLabel="${element.ariaLabel}", tag="${element.tag}"`,
          note: missing ? 'Missing aria-label on button' : 'Aria label present',
        });
        continue;
      }

      results.push({
        issueElementId: issue.elementId,
        personaId: analysis.personaId,
        verdict: 'unverified',
        evidence: '',
        note: 'Subjective claim - not measurable from DOM data',
      });
    }
  }

  return results;
}
