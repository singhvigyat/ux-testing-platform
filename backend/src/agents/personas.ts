import { Persona } from '../types';

export const MAYA: Persona = {
  id: "elderly_non_technical",
  name: "Maya",
  age: 62,
  background: "Retired schoolteacher. Uses WhatsApp and email daily. Struggles with small text, unfamiliar icons, and multi-step flows. Prefers clear labels over icons alone.",
  goals: ["find information quickly", "complete tasks without asking for help"],
  painPoints: ["small fonts", "unclear buttons", "too many steps", "jargon"],
  traits: {
    readingSpeed: "slow",
    visionAcuity: "reduced",
    techFamiliarity: "low",
    attentionSpan: "medium",
    errorTolerance: "low"
  },
  heuristics: [
    "text_readability",
    "tap_target_size",
    "navigation_clarity",
    "form_simplicity",
    "error_recovery",
    "cognitive_load"
  ]
};

export const personas: Persona[] = [MAYA];
