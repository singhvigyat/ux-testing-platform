import path from 'path';
import fs from 'fs';
import { PersonaConfig } from './personas';
import { PersonaAnalysis } from '../types';
import { analyzeScreenshotWithGemini } from '../ai/visionService';

const SCREENSHOTS_BASE_DIR = path.join(__dirname, '..', '..', 'screenshots');

/**
 * Runs a single persona analysis on a screenshot.
 * Converts the relative URL path to an absolute filesystem path,
 * calls Gemini, and parses the structured JSON response.
 *
 * @param persona - The persona configuration to use
 * @param screenshotUrl - The relative URL path (e.g. /screenshots/jobId/desktop.png)
 * @returns Structured PersonaAnalysis object
 */
export async function analyzeWithPersona(
  persona: PersonaConfig,
  screenshotUrl: string,
): Promise<PersonaAnalysis> {
  // Convert URL path to absolute filesystem path
  // screenshotUrl = /screenshots/<jobId>/desktop.png
  const relativePart = screenshotUrl.replace('/screenshots/', '');
  
  const basePath = path.dirname(relativePart);
  const fileName = path.basename(relativePart);
  const viewport = fileName.replace('.png', '');
  
  // Swap raw screenshot path to SoM screenshot path
  const somPart = path.join(basePath, `som-${fileName}`);
  const absolutePath = path.join(SCREENSHOTS_BASE_DIR, somPart);

  // Read UI structure (for Step 04)
  const uiStructurePath = path.join(SCREENSHOTS_BASE_DIR, basePath, `ui-structure-${viewport}.json`);
  let uiStructureJson = '';
  try {
    uiStructureJson = fs.readFileSync(uiStructurePath, 'utf8');
  } catch (err) {
    console.warn(`[Persona: ${persona.name}] Could not read UI structure file:`, uiStructurePath);
  }

  const somInstruction = `
The screenshot you are analyzing contains numbered labels (blue badges with white numbers).
Each number corresponds to a specific UI element on the page.

When you identify a UX issue or observation, you MUST reference the element by its number.

Example of correct format:
"Element [6] — the sign-up button — has insufficient tap target size."

Example of incorrect format:
"The button near the form is too small."

Never describe an element's position without referencing its number.
If you cannot identify which numbered element you are referring to, do not make the claim.

Here is the structured data for every labeled element on this page:
<ui_structure>
${uiStructureJson}
</ui_structure>

Use this data to verify your claims. If you say a button is too small, reference its actual height from the data.
`;

  const prompt = persona.promptTemplate() + '\n\n' + somInstruction;

  let rawResponse: string;
  try {
    rawResponse = await analyzeScreenshotWithGemini(absolutePath, prompt);
  } catch (error) {
    console.error(`[Persona: ${persona.name}] API call failed:`, (error as Error).message);
    throw error;
  }

  // Parse the JSON response from Gemini
  const parsed = parseGeminiResponse(rawResponse, persona);

  return {
    persona: persona.name,
    personaId: persona.id,
    ...parsed,
  };
}

/**
 * Parses Gemini's JSON response with fallback for malformed output.
 * Gemini sometimes wraps JSON in markdown code blocks — we strip those.
 */
function parseGeminiResponse(
  raw: string,
  persona: PersonaConfig,
): Omit<PersonaAnalysis, 'persona' | 'personaId'> {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/, '');

  // Find the first { and last } to extract just the JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);

    return {
      usabilityIssues: ensureStringArray(parsed.usabilityIssues),
      accessibilityIssues: ensureStringArray(parsed.accessibilityIssues),
      confusionPoints: ensureStringArray(parsed.confusionPoints),
      positiveObservations: ensureStringArray(parsed.positiveObservations),
      severityScore: ensureNumber(parsed.severityScore, 5),
    };
  } catch (parseError) {
    console.warn(`[Persona: ${persona.name}] Failed to parse JSON response. Using fallback.`);
    console.warn('Raw response:', raw.slice(0, 200));

    // Return a fallback analysis rather than crashing
    return {
      usabilityIssues: ['Unable to parse detailed analysis from AI response'],
      accessibilityIssues: [],
      confusionPoints: ['AI response format was unexpected'],
      positiveObservations: ['Analysis was attempted but response format was non-standard'],
      severityScore: 5,
    };
  }
}

function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === 'string').map((v) => String(v));
  }
  return [];
}

function ensureNumber(value: unknown, fallback: number): number {
  const num = Number(value);
  if (isNaN(num) || num < 1 || num > 10) return fallback;
  return Math.round(num);
}
