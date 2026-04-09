/**
 * Persona definitions for the UX Testing Platform.
 * Each persona represents a different type of user with distinct needs,
 * technical abilities, and evaluation focus areas.
 */

export interface PersonaConfig {
  id: string;
  name: string;
  description: string;
  avatar: string; // emoji
  evaluationFocus: string[];
  promptTemplate: (url?: string) => string;
}

export const personas: PersonaConfig[] = [
  // ─── 1. Elderly Non-Technical User ────────────────────────────────────────
  {
    id: 'elderly-user',
    name: 'Margaret, 68',
    description: 'Retired teacher, uses technology occasionally. Struggles with complex interfaces, small fonts, and unclear navigation.',
    avatar: '👵',
    evaluationFocus: [
      'Navigation clarity',
      'Button discoverability',
      'Font size & readability',
      'Confusion points',
      'Visual clutter',
    ],
    promptTemplate: () => `
Evaluate this UI as Margaret (68, non-technical). You struggle with small text, hidden buttons, and clutter.
Focus: clear purpose, easy navigation, obvious large buttons/text, reducing clutter.
Return ONLY valid JSON (no markdown or extra text):
{"usabilityIssues":["..."],"accessibilityIssues":["..."],"confusionPoints":["..."],"positiveObservations":["..."],"severityScore": 7}
Rules: 2-5 items/array. severityScore 1(great)-10(unusable). Be specific. Act as Margaret.
`.trim(),
  },

  // ─── 2. Software Developer ────────────────────────────────────────────────
  {
    id: 'developer-user',
    name: 'Alex, 27',
    description: 'Full-stack developer at a startup. Highly technical, skims pages quickly, values clear documentation and APIs. Has high standards for performance and design.',
    avatar: '👨‍💻',
    evaluationFocus: [
      'Information density',
      'Technical documentation accessibility',
      'API/SDK discoverability',
      'Performance signals',
      'Developer experience',
    ],
    promptTemplate: () => `
Evaluate this UI as Alex (27, tech-savvy dev). You look for docs, APIs, credible design, and performance signals.
Focus: clear technical value, quick-start paths, API/SDK visibility, developer experience.
Return ONLY valid JSON (no markdown or extra text):
{"usabilityIssues":["..."],"accessibilityIssues":["..."],"confusionPoints":["..."],"positiveObservations":["..."],"severityScore": 4}
Rules: 2-5 items/array. severityScore 1(great dev UX)-10(terrible). Be specific. Act as Alex.
`.trim(),
  },

  // ─── 3. First-Time Visitor ────────────────────────────────────────────────
  {
    id: 'first-time-visitor',
    name: 'Jordan, 32',
    description: 'Marketing manager exploring new tools. Has never seen this site before. Quickly judges whether to stay or leave. Values clear value propositions and trusts social proof.',
    avatar: '🧑',
    evaluationFocus: [
      'First impression & value proposition',
      'Primary CTA discoverability',
      'Trust signals',
      'Onboarding clarity',
      'Bounce risk assessment',
    ],
    promptTemplate: () => `
Evaluate this UI as Jordan (32, busy manager). You decide to stay/leave in 5s. You value trust signals and clear next steps.
Focus: instant value prop, prominent CTA, trust signals (logos, reviews), bounce risks.
Return ONLY valid JSON (no markdown or extra text):
{"usabilityIssues":["..."],"accessibilityIssues":["..."],"confusionPoints":["..."],"positiveObservations":["..."],"severityScore": 5}
Rules: 2-5 items/array. severityScore 1(compelling)-10(instant bounce). Be specific. Act as Jordan.
`.trim(),
  },

  // ─── 4. Visually Impaired User ───────────────────────────────────────────
  {
    id: 'visually-impaired',
    name: 'Sam, 45',
    description: 'Has low vision (uses browser zoom and relies on high contrast). Assesses what accessibility barriers exist based on visual inspection of the screenshot.',
    avatar: '🦯',
    evaluationFocus: [
      'Color contrast',
      'Text size & spacing',
      'Visual hierarchy',
      'Link & button visibility',
      'WCAG compliance signals',
    ],
    promptTemplate: () => `
Evaluate this UI as Sam (45, low vision). You rely on 150% zoom and high contrast (WCAG AA).
Focus: color contrast, large interactive elements, adequate text size/spacing, visual hierarchy without color reliance.
Return ONLY valid JSON (no markdown or extra text):
{"usabilityIssues":["..."],"accessibilityIssues":["..."],"confusionPoints":["..."],"positiveObservations":["..."],"severityScore": 6}
Rules: 2-5 items/array. severityScore 1(accessible)-10(severe barriers). Be specific. Act as Sam.
`.trim(),
  },
];
