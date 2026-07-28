import type { DocumentDomain, DocumentTypeDefinition } from "../types";

type Preset = {
  key: string;
  label: string;
  domain: DocumentDomain;
};

/** System presets — configurable; orgs may add user-defined types. */
export const DOCUMENT_TYPE_PRESETS: readonly Preset[] = Object.freeze([
  // General
  { key: "general", label: "General Document", domain: "general" },
  { key: "pdf", label: "PDF", domain: "general" },
  { key: "word", label: "Word", domain: "general" },
  { key: "excel", label: "Excel", domain: "general" },
  { key: "powerpoint", label: "PowerPoint", domain: "general" },
  { key: "image", label: "Image", domain: "general" },
  { key: "audio", label: "Audio", domain: "general" },
  { key: "video", label: "Video", domain: "general" },
  { key: "email", label: "Email", domain: "general" },
  { key: "text", label: "Text", domain: "general" },
  // Education (interpretation → P-015)
  { key: "iep", label: "IEP", domain: "education" },
  { key: "504", label: "504 Plan", domain: "education" },
  { key: "psych_report", label: "Psychological Report", domain: "education" },
  {
    key: "neuropsych",
    label: "Neuropsychological Evaluation",
    domain: "education",
  },
  { key: "speech_eval", label: "Speech Evaluation", domain: "education" },
  { key: "ot_eval", label: "Occupational Therapy Evaluation", domain: "education" },
  { key: "pt_eval", label: "Physical Therapy Evaluation", domain: "education" },
  { key: "fba", label: "Functional Behavior Assessment", domain: "education" },
  { key: "bip", label: "Behavior Intervention Plan", domain: "education" },
  { key: "report_card", label: "Report Card", domain: "education" },
  { key: "transcript", label: "Transcript", domain: "education" },
  { key: "assessment", label: "Assessment", domain: "education" },
  { key: "progress_monitoring", label: "Progress Monitoring", domain: "education" },
  { key: "teacher_observation", label: "Teacher Observation", domain: "education" },
  { key: "parent_communication", label: "Parent Communication", domain: "education" },
  { key: "medical_documentation", label: "Medical Documentation", domain: "education" },
  { key: "vision", label: "Vision", domain: "education" },
  { key: "hearing", label: "Hearing", domain: "education" },
  { key: "curriculum_sample", label: "Curriculum Sample", domain: "education" },
  { key: "student_work", label: "Student Work", domain: "education" },
  // Finance
  { key: "invoice", label: "Invoice", domain: "finance" },
  { key: "bill", label: "Bill", domain: "finance" },
  { key: "statement", label: "Statement", domain: "finance" },
  { key: "receipt", label: "Receipt", domain: "finance" },
  { key: "contract_finance", label: "Contract", domain: "finance" },
  { key: "payroll", label: "Payroll Document", domain: "finance" },
  { key: "tax", label: "Tax Document", domain: "finance" },
  // Board
  { key: "minutes", label: "Minutes", domain: "board" },
  { key: "policy", label: "Policy", domain: "board" },
  { key: "agenda", label: "Agenda", domain: "board" },
  { key: "resolution", label: "Resolution", domain: "board" },
  // Legal
  { key: "contract_legal", label: "Legal Contract", domain: "legal" },
  { key: "compliance", label: "Compliance", domain: "legal" },
  { key: "licensing", label: "Licensing", domain: "legal" },
  { key: "insurance", label: "Insurance", domain: "legal" },
  { key: "litigation", label: "Litigation", domain: "legal" },
  // HR
  { key: "application", label: "Application", domain: "hr" },
  { key: "evaluation_hr", label: "Evaluation", domain: "hr" },
  { key: "background_check", label: "Background Check", domain: "hr" },
  { key: "training", label: "Training", domain: "hr" },
  { key: "disciplinary", label: "Disciplinary Document", domain: "hr" },
]);

export function presetAsDefinition(p: Preset): DocumentTypeDefinition {
  return Object.freeze({
    id: `dtype:system:${p.key}`,
    organizationId: null,
    key: p.key,
    label: p.label,
    domain: p.domain,
    active: true,
    systemPreset: true,
  });
}
