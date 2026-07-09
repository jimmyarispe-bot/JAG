/** Reference evidence type catalog — Doc 27 taxonomy (Wave 1 subset). */

export interface EvidenceTypeDefinition {
  category: string;
  label: string;
  typicalSource: string;
}

export const EVIDENCE_TYPE_CATALOG: Record<string, EvidenceTypeDefinition> = {
  "observation.instructional": {
    category: "observation",
    label: "Instructional Observation",
    typicalSource: "Educator",
  },
  "observation.checklist": {
    category: "observation",
    label: "Structured Checklist",
    typicalSource: "Educator",
  },
  "observation.fidelity": {
    category: "observation",
    label: "Program Fidelity",
    typicalSource: "Educator, coach",
  },
  "measurement.formative": {
    category: "measurement",
    label: "Formative Check",
    typicalSource: "Educator / system",
  },
  "measurement.progress": {
    category: "measurement",
    label: "Progress Monitoring",
    typicalSource: "Educator",
  },
  "measurement.placement": {
    category: "measurement",
    label: "Placement Assessment",
    typicalSource: "System",
  },
  "artifact.product": {
    category: "artifact",
    label: "Academic Product",
    typicalSource: "Student",
  },
  "artifact.portfolio": {
    category: "artifact",
    label: "Portfolio Collection",
    typicalSource: "Student",
  },
  "media.video": {
    category: "media",
    label: "Student Video",
    typicalSource: "Student",
  },
  "self.reflection": {
    category: "reflection",
    label: "Student Reflection",
    typicalSource: "Student",
  },
  "parent.feedback": {
    category: "reflection",
    label: "Parent Feedback",
    typicalSource: "Parent",
  },
  "mastery.validation": {
    category: "mastery",
    label: "Mastery Validation",
    typicalSource: "Educator",
  },
};

export function getEvidenceTypeDefinition(typeKey: string): EvidenceTypeDefinition | undefined {
  return EVIDENCE_TYPE_CATALOG[typeKey];
}

export function isKnownEvidenceType(typeKey: string): boolean {
  return typeKey in EVIDENCE_TYPE_CATALOG;
}
