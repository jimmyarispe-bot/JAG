/**
 * Persona adaptation — role-aware tone and path selection.
 */

import { MR_JAG_PERSONAS, type MrJagPersona } from "../types";

export function listPersonas(): readonly MrJagPersona[] {
  return MR_JAG_PERSONAS;
}

export function normalizePersona(input?: string | null): MrJagPersona {
  if (!input) return "Executive";
  const hit = MR_JAG_PERSONAS.find(
    (p) => p.toLowerCase() === input.trim().toLowerCase()
  );
  return hit ?? "Executive";
}

export function personaFocus(persona: MrJagPersona): readonly string[] {
  switch (persona) {
    case "Founder":
      return ["strategy", "platform health", "release readiness", "growth"];
    case "Executive":
      return ["insights", "operations", "risk", "compliance"];
    case "School Leader":
      return ["campuses", "staffing", "enrollment", "outcomes"];
    case "Teacher":
      return ["attendance", "lessons", "assessments", "communication"];
    case "Admissions":
      return ["applicants", "documents", "enrollment", "family portal"];
    case "Finance":
      return ["invoices", "tuition", "payments", "scholarships"];
    case "HR":
      return ["employees", "payroll", "certifications", "onboarding"];
    case "Parent":
      return ["progress", "billing", "messages", "calendar"];
    case "Student":
      return ["schedule", "assignments", "goals", "support"];
    case "Support":
      return ["troubleshooting", "diagnostics", "incidents", "escalation"];
    case "Developer":
      return ["APIs", "extensions", "SDK", "integrations"];
    default:
      return ["getting started"];
  }
}

export function adaptAnswerTone(
  persona: MrJagPersona,
  body: string
): string {
  const focus = personaFocus(persona).slice(0, 3).join(", ");
  return `${body}\n\n_As a ${persona}, prioritize: ${focus}._`;
}
