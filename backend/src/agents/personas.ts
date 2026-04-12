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

export const DEV: Persona = {
  id: "developer",
  name: "Dev",
  age: 24,
  background: "Full-stack developer. Evaluates interfaces critically for efficiency. Annoyed by unnecessary steps, missing keyboard shortcuts, and non-standard UI patterns. Wants to accomplish tasks fast.",
  goals: ["complete tasks in minimum clicks", "understand information hierarchy immediately"],
  painPoints: ["slow load times", "forced onboarding", "modal overload", "unclear error messages"],
  traits: {
    readingSpeed: "fast",
    visionAcuity: "normal",
    techFamiliarity: "expert",
    attentionSpan: "low",
    errorTolerance: "medium"
  },
  heuristics: [
    "information_hierarchy",
    "task_efficiency",
    "error_message_clarity",
    "visual_noise",
    "consistency",
    "loading_feedback"
  ]
};

export const ARJUN: Persona = {
  id: "first_time_visitor",
  name: "Arjun",
  age: 28,
  background: "Marketing professional. Landed on this page from a Google ad. Has no prior context about the product. Evaluating if it is worth his time in the next 10 seconds.",
  goals: ["understand what this product does in under 10 seconds", "find a clear next step"],
  painPoints: ["unclear value proposition", "buried CTAs", "too much text before the hook", "no social proof"],
  traits: {
    readingSpeed: "medium",
    visionAcuity: "normal",
    techFamiliarity: "medium",
    attentionSpan: "very_low",
    errorTolerance: "low"
  },
  heuristics: [
    "value_proposition_clarity",
    "cta_visibility",
    "first_impression",
    "trust_signals",
    "cognitive_load",
    "navigation_clarity"
  ]
};

export const PRIYA: Persona = {
  id: "visually_impaired",
  name: "Priya",
  age: 34,
  background: "Works in HR. Has moderate low vision — uses browser zoom at 150% and relies on high contrast. Does not use a screen reader but needs sufficient color contrast and text size.",
  goals: ["read all content without straining", "interact with all elements without missing them"],
  painPoints: ["low contrast text", "small interactive targets", "color-only information", "icons without labels"],
  traits: {
    readingSpeed: "slow",
    visionAcuity: "low",
    techFamiliarity: "medium",
    attentionSpan: "medium",
    errorTolerance: "medium"
  },
  heuristics: [
    "color_contrast",
    "text_size",
    "tap_target_size",
    "icon_labeling",
    "focus_visibility",
    "color_independence"
  ]
};

export const personas: Persona[] = [MAYA, DEV, ARJUN, PRIYA];
