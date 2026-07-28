import type {
  AcademyApplicant,
  AdmissionsAuditEntry,
  AdmissionsNotification,
  AdmissionsTimelineEntry,
  ApplicantDocument,
  DocumentRequirementConfig,
  EnrollmentWizardState,
} from "./types";

type AdmissionsStore = {
  applicants: Map<string, AcademyApplicant>;
  documents: Map<string, ApplicantDocument>;
  requirements: Map<string, DocumentRequirementConfig>;
  wizards: Map<string, EnrollmentWizardState>;
  timeline: AdmissionsTimelineEntry[];
  audit: AdmissionsAuditEntry[];
  notifications: AdmissionsNotification[];
};

const g = globalThis as typeof globalThis & {
  __academyOsAdmissionsStore?: AdmissionsStore;
};

function store(): AdmissionsStore {
  if (!g.__academyOsAdmissionsStore) {
    g.__academyOsAdmissionsStore = {
      applicants: new Map(),
      documents: new Map(),
      requirements: new Map(),
      wizards: new Map(),
      timeline: [],
      audit: [],
      notifications: [],
    };
  }
  return g.__academyOsAdmissionsStore;
}

export function resetAdmissionsStoreForTests(): void {
  g.__academyOsAdmissionsStore = {
    applicants: new Map(),
    documents: new Map(),
    requirements: new Map(),
    wizards: new Map(),
    timeline: [],
    audit: [],
    notifications: [],
  };
}

function key(organizationId: string, id: string): string {
  return `${organizationId}::${id}`;
}

export function upsertApplicant(a: AcademyApplicant): AcademyApplicant {
  store().applicants.set(key(a.organizationId, a.id), a);
  return a;
}

export function getApplicant(
  organizationId: string,
  id: string
): AcademyApplicant | null {
  return store().applicants.get(key(organizationId, id)) ?? null;
}

export function listApplicants(
  organizationId: string
): readonly AcademyApplicant[] {
  return Object.freeze(
    [...store().applicants.values()]
      .filter((a) => a.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function findApplicantByParentToken(
  token: string
): AcademyApplicant | null {
  return (
    [...store().applicants.values()].find(
      (a) => a.parentAccessToken === token
    ) ?? null
  );
}

export function upsertDocument(d: ApplicantDocument): ApplicantDocument {
  store().documents.set(key(d.organizationId, d.id), d);
  return d;
}

export function listDocuments(
  organizationId: string,
  applicantId?: string
): readonly ApplicantDocument[] {
  return Object.freeze(
    [...store().documents.values()]
      .filter(
        (d) =>
          d.organizationId === organizationId &&
          (applicantId == null || d.applicantId === applicantId)
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function getDocument(
  organizationId: string,
  id: string
): ApplicantDocument | null {
  return store().documents.get(key(organizationId, id)) ?? null;
}

export function upsertRequirement(
  r: DocumentRequirementConfig
): DocumentRequirementConfig {
  const k = `${r.organizationId}::${r.program}::${r.gradeLevel ?? "*"}`;
  store().requirements.set(k, r);
  return r;
}

export function getRequirements(
  organizationId: string,
  program: string,
  gradeLevel: string | null
): DocumentRequirementConfig | null {
  return (
    store().requirements.get(
      `${organizationId}::${program}::${gradeLevel ?? "*"}`
    ) ??
    store().requirements.get(`${organizationId}::${program}::*`) ??
    store().requirements.get(`${organizationId}::default::*`) ??
    null
  );
}

export function listRequirements(
  organizationId: string
): readonly DocumentRequirementConfig[] {
  return Object.freeze(
    [...store().requirements.values()].filter(
      (r) => r.organizationId === organizationId
    )
  );
}

export function upsertWizard(w: EnrollmentWizardState): EnrollmentWizardState {
  store().wizards.set(key(w.organizationId, w.id), w);
  return w;
}

export function getWizard(
  organizationId: string,
  id: string
): EnrollmentWizardState | null {
  return store().wizards.get(key(organizationId, id)) ?? null;
}

export function getWizardByApplicant(
  organizationId: string,
  applicantId: string
): EnrollmentWizardState | null {
  return (
    [...store().wizards.values()].find(
      (w) =>
        w.organizationId === organizationId && w.applicantId === applicantId
    ) ?? null
  );
}

export function appendTimeline(
  entry: AdmissionsTimelineEntry
): AdmissionsTimelineEntry {
  store().timeline.push(entry);
  return entry;
}

export function listTimeline(
  organizationId: string,
  applicantId?: string
): readonly AdmissionsTimelineEntry[] {
  return Object.freeze(
    store()
      .timeline.filter(
        (e) =>
          e.organizationId === organizationId &&
          (applicantId == null || e.applicantId === applicantId)
      )
      .sort((a, b) => b.at.localeCompare(a.at))
  );
}

export function appendAudit(entry: AdmissionsAuditEntry): AdmissionsAuditEntry {
  store().audit.push(entry);
  return entry;
}

export function listAudit(
  organizationId: string,
  applicantId?: string
): readonly AdmissionsAuditEntry[] {
  return Object.freeze(
    store()
      .audit.filter(
        (e) =>
          e.organizationId === organizationId &&
          (applicantId == null || e.applicantId === applicantId)
      )
      .sort((a, b) => b.at.localeCompare(a.at))
  );
}

export function appendNotification(
  n: AdmissionsNotification
): AdmissionsNotification {
  store().notifications.push(n);
  return n;
}

export function listNotifications(
  organizationId: string,
  applicantId?: string
): readonly AdmissionsNotification[] {
  return Object.freeze(
    store()
      .notifications.filter(
        (n) =>
          n.organizationId === organizationId &&
          (applicantId == null || n.applicantId === applicantId)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}
