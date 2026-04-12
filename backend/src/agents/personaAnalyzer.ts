import fs from 'fs';
import path from 'path';
import { Persona, PersonaAnalysis, UIStructure, Viewport } from '../types';
import { analyzeBufferWithGemini } from '../ai/visionService';

export async function runPersonaAgent(
  persona: Persona,
  somScreenshot: Buffer,
  uiStructure: UIStructure,
  viewport: Viewport,
  maxRetries = 3
): Promise<PersonaAnalysis | null> {
  const allowedElementIds = new Set(uiStructure.elements.map(e => e.id));

  const basePrompt = `You are ${persona.name}, a ${persona.age}-year-old.

Your background: ${persona.background}

Your goals when visiting any website:
${persona.goals.map(g => `- ${g}`).join('\n')}

Before listing issues, write 2-4 sentences of honest first-person reasoning about your overall impression of the interface.

You must evaluate the following heuristics:
${persona.heuristics.map((h, i) => `${i + 1}. ${h}`).join('\n')}

You are given:
- A labeled screenshot where every UI element has a numbered badge [N]
- A structured JSON describing each element's tag, text, section, and additional flags

JSON field guide:
- "text": the element's visible text. If this reads "[visual label — see screenshot]" it means the label is drawn INSIDE an image or SVG — look at the screenshot to read it. Do NOT report these elements as having no text.
- "imageOnly": true means the element's content is an image or SVG. Its visual label is visible in the screenshot.
- "ariaLabel": the element's accessible name — treat this as equivalent to visible text.

Rules:
- Every issue you report MUST reference a real element ID from the JSON
- Never invent elements that do not exist in the JSON
- If you cannot find evidence for a claim, do not make the claim
- Write observations in first person: "I noticed..." or "I found it hard to..."
- CRITICAL: Never report that an image or SVG-based logo/icon is missing a text label based solely on an empty JSON 'text' field. You MUST check the screenshot visually before making that claim.

Respond ONLY with a valid JSON object matching the PersonaAnalysis schema.
No preamble, no explanation, no markdown code fences. Raw JSON only.

Expected JSON Schema:
{
  "personaId": "elderly_non_technical",
  "personaName": "Maya",
  "viewport": "desktop",
  "reasoning": "2-4 sentences of thinking before issues list (chain-of-thought)",
  "issues": [
    {
      "elementId": 123,
      "elementDescription": "brief description of what the element is",
      "section": "section the element belongs to",
      "heuristic": "which heuristic this violates",
      "observation": "what you noticed (1-2 sentences, first person)",
      "impact": "why this matters for you specifically",
      "severity": "low | medium | high | critical",
      "recommendation": "one concrete fix"
    }
  ],
  "positives": ["1-3 things you found easy or good"],
  "overallScore": 5
}

Here is the structured data for every labeled element on this page:
<ui_structure>
${JSON.stringify(uiStructure, null, 2)}
</ui_structure>
`;


  let attempt = 0;
  let validationErrors = '';

  while (attempt < maxRetries) {
    attempt++;
    const finalPrompt = basePrompt + (validationErrors ? `\n\nPrevious attempt failed with errors:\n${validationErrors}\n\nPlease fix these and return a valid JSON.` : '');
    
    let rawResponse = '';
    try {
      rawResponse = await analyzeBufferWithGemini(somScreenshot, finalPrompt);
    } catch (e) {
      console.error(`[PersonaAgent] Gemini call failed`, e);
      return null;
    }

    // Strip markdown code fences if present
    let cleaned = rawResponse.trim();
    cleaned = cleaned.replace(/^```(json)?\s*/i, '').replace(/\s*```$/, '');
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.warn(`[PersonaAgent] JSON parse failed on attempt ${attempt}`);
      validationErrors = "Failed to parse JSON. Please ensure your response is strictly valid JSON.";
      continue;
    }

    // Basic schema validation
    if (!parsed.issues || !Array.isArray(parsed.issues)) {
      validationErrors = "Missing 'issues' array in JSON.";
      console.warn(`[PersonaAgent] Validation failed: Missing issues array. Raw:`, cleaned.slice(0, 100));
      continue;
    }

    // Validate element IDs against uiStructure
    const invalidIds: number[] = [];
    for (const issue of parsed.issues) {
      if (typeof issue.elementId !== 'number') {
        validationErrors = "All issues must have a numeric 'elementId'.";
        console.warn(`[PersonaAgent] Validation failed: Non-numeric elementId found.`);
        invalidIds.push(NaN); // Just a marker
        break;
      }
      if (!allowedElementIds.has(issue.elementId)) {
        invalidIds.push(issue.elementId);
      }
    }

    if (invalidIds.length > 0 && !invalidIds.includes(NaN)) {
      validationErrors = `The following element IDs do not exist: [${invalidIds.join(', ')}]. Remove those issues or correct the IDs.`;
      console.warn(`[PersonaAgent] Invalid IDs found on attempt ${attempt}:`, invalidIds);
      continue; // Try again
    } else if (invalidIds.includes(NaN)) {
      continue;
    }

    // If we made it here, validation passed!
    console.log(`[PersonaAgent] Success on attempt ${attempt}.`);
    
    // Fill in default static PersonaAnalysis fields just in case they were missed
    return {
      personaId: persona.id,
      personaName: persona.name,
      viewport: viewport,
      reasoning: parsed.reasoning || "Reasoning missing.",
      issues: parsed.issues,
      positives: Array.isArray(parsed.positives) ? parsed.positives : [],
      overallScore: typeof parsed.overallScore === 'number' ? parsed.overallScore : 5
    } as PersonaAnalysis;
  }

  console.error(`[PersonaAgent] Failed after ${maxRetries} retries.`);
  
  // Return partial result if 3 retries fail, do not crash
  return {
    personaId: persona.id,
    personaName: persona.name,
    viewport: viewport,
    reasoning: "Analysis failed due to repeated validation errors.",
    issues: [],
    positives: [],
    overallScore: 5
  };
}

// Keep a wrapper for the controller to use, which reads files from disk
const SCREENSHOTS_BASE_DIR = path.join(__dirname, '..', '..', 'screenshots');

export async function analyzeWithPersona(
  persona: Persona,
  screenshotUrl: string,
): Promise<PersonaAnalysis> {
  const relativePart = screenshotUrl.replace('/screenshots/', '');
  const basePath = path.dirname(relativePart);
  const fileName = path.basename(relativePart);
  const viewport = fileName.replace('.png', '') as Viewport;
  
  const somPart = path.join(basePath, `som-${fileName}`);
  const absolutePath = path.join(SCREENSHOTS_BASE_DIR, somPart);

  const uiStructurePath = path.join(SCREENSHOTS_BASE_DIR, basePath, `ui-structure-${viewport}.json`);
  let uiStructureData: UIStructure = { viewport, elements: [], sections: {} };
  
  try {
    const uiStructureJson = fs.readFileSync(uiStructurePath, 'utf8');
    uiStructureData = JSON.parse(uiStructureJson);
  } catch (err) {
    console.warn(`[Persona: ${persona.name}] Could not read UI structure file:`, uiStructurePath);
  }

  let imageBuffer: Buffer;
  try {
    imageBuffer = fs.readFileSync(absolutePath);
  } catch (err) {
    console.warn(`[Persona: ${persona.name}] Could not read SoM screenshot file, trying original screenshot...`);
    imageBuffer = fs.readFileSync(path.join(SCREENSHOTS_BASE_DIR, relativePart));
  }

  const result = await runPersonaAgent(persona, imageBuffer, uiStructureData, viewport);
  return result as PersonaAnalysis;
}
