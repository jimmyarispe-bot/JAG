import type { ReleaseState, ReleaseStateDefinition } from "@/lib/certification/release-governance/types";

export const RELEASE_STATES: ReleaseStateDefinition[] = [
  {
    id: "development",
    label: "Development",
    order: 10,
    description: "Active feature implementation under normal engineering process.",
    entryCriteria: ["Release branch or epic approved", "Scope documented"],
    exitCriteria: ["Feature freeze declared", "Scope locked for RC program"],
    requiredApproverRoles: ["Engineering Lead"],
    requiredDocuments: ["Scope / epic index"],
    evidenceRequired: ["PR history", "Open defect baseline"],
  },
  {
    id: "feature_complete",
    label: "Feature Complete",
    order: 20,
    description: "No new business functionality for this release train.",
    entryCriteria: ["Feature freeze", "Known gaps logged"],
    exitCriteria: ["Architecture review scheduled or complete"],
    requiredApproverRoles: ["Product", "Engineering Lead"],
    requiredDocuments: ["Feature freeze note", "Gap register"],
    evidenceRequired: ["Freeze announcement"],
  },
  {
    id: "architecture_approved",
    label: "Architecture Approved",
    order: 30,
    description: "Architecture remediation / review complete for the release.",
    entryCriteria: ["Architecture package reviewed"],
    exitCriteria: ["Security review may begin"],
    requiredApproverRoles: ["Architecture"],
    requiredDocuments: ["Architecture certification"],
    evidenceRequired: ["Architecture report", "ADR index"],
  },
  {
    id: "security_approved",
    label: "Security Approved",
    order: 40,
    description: "Security certification with residual risks accepted or closed.",
    entryCriteria: ["Security package reviewed", "Critical vulns closed"],
    exitCriteria: ["Performance review may begin"],
    requiredApproverRoles: ["Security"],
    requiredDocuments: ["Security certification"],
    evidenceRequired: ["RLS evidence", "Dependency scan", "Secrets review"],
  },
  {
    id: "performance_approved",
    label: "Performance Approved",
    order: 50,
    description: "Performance benchmarks met or formally waived.",
    entryCriteria: ["Perf suite or waiver"],
    exitCriteria: ["UX review may begin"],
    requiredApproverRoles: ["Engineering Lead", "Ops"],
    requiredDocuments: ["Performance certification"],
    evidenceRequired: ["Load results or signed waiver"],
  },
  {
    id: "ux_approved",
    label: "UX Approved",
    order: 60,
    description: "UX / accessibility gate passed or conditional with plan.",
    entryCriteria: ["UX / a11y package reviewed"],
    exitCriteria: ["Testing certification may begin"],
    requiredApproverRoles: ["Product", "UX"],
    requiredDocuments: ["UX / a11y certification"],
    evidenceRequired: ["A11y results", "Critical UX defects closed"],
  },
  {
    id: "testing_certified",
    label: "Testing Certified",
    order: 70,
    description: "Automated + required manual testing certified.",
    entryCriteria: ["Quality gates green for required suites"],
    exitCriteria: ["Documentation package may close"],
    requiredApproverRoles: ["QA Lead"],
    requiredDocuments: ["Testing certification"],
    evidenceRequired: ["Unit/integration/E2E results", "Coverage report"],
  },
  {
    id: "documentation_complete",
    label: "Documentation Complete",
    order: 80,
    description: "Ops, support, and user documentation complete for the release.",
    entryCriteria: ["Docs package reviewed"],
    exitCriteria: ["RC1 may start"],
    requiredApproverRoles: ["Ops", "Product"],
    requiredDocuments: ["Documentation certification"],
    evidenceRequired: ["Runbooks", "Guides index"],
  },
  {
    id: "rc1",
    label: "Release Candidate 1",
    order: 90,
    description: "Engineering certification against staging-class evidence.",
    entryCriteria: ["Feature freeze", "Docs baseline", "CI green"],
    exitCriteria: ["Engineering sign-off", "Zero Critical blockers"],
    requiredApproverRoles: ["Engineering Lead", "QA Lead", "Release Manager"],
    requiredDocuments: ["RC1 Engineering Certification Package"],
    evidenceRequired: ["Typecheck", "Lint", "Tests", "Build", "Staging deploy", "Migration evidence"],
  },
  {
    id: "rc2",
    label: "Release Candidate 2",
    order: 100,
    description: "Internal business / operations validation.",
    entryCriteria: ["RC1 signed"],
    exitCriteria: ["Business + ops sign-off"],
    requiredApproverRoles: ["Product", "Ops", "Release Manager"],
    requiredDocuments: ["RC2 Operations / Product Certification Package"],
    evidenceRequired: ["Workflow matrix", "UAT log", "Support readiness"],
  },
  {
    id: "rc3",
    label: "Release Candidate 3",
    order: 110,
    description: "Controlled pilot with selected organizations.",
    entryCriteria: ["RC2 signed", "Pilot schools designated"],
    exitCriteria: ["Pilot exit criteria met"],
    requiredApproverRoles: ["Pilot Sponsor", "Ops", "Security", "Release Manager"],
    requiredDocuments: ["RC3 Pilot Certification Package"],
    evidenceRequired: ["Telemetry", "Feedback", "Support volume", "Stability"],
  },
  {
    id: "rc3_5",
    label: "Release Candidate 3.5 (Dress Rehearsal)",
    order: 120,
    description: "Production deployment / DR / rollback dress rehearsal.",
    entryCriteria: ["RC3 signed or conditional with waiver"],
    exitCriteria: ["Dress rehearsal report signed"],
    requiredApproverRoles: ["Ops", "Release Manager", "Engineering Lead"],
    requiredDocuments: ["RC3.5 Dress Rehearsal Package"],
    evidenceRequired: ["Deploy log", "Migrate log", "Backup/restore", "Rollback drill", "Monitoring"],
  },
  {
    id: "rc4",
    label: "Release Candidate 4",
    order: 130,
    description: "Executive Go / No-Go review.",
    entryCriteria: ["RC1–RC3.5 signed", "Risk register current"],
    exitCriteria: ["Executive GO decision"],
    requiredApproverRoles: ["Executive Sponsor", "Security", "Ops", "Product", "Release Manager"],
    requiredDocuments: ["RC4 Executive Certification Package"],
    evidenceRequired: ["Decision matrix", "Final risk register", "Release notes draft"],
  },
  {
    id: "general_availability",
    label: "General Availability",
    order: 140,
    description: "Production GA authorized and announced.",
    entryCriteria: ["RC4 GO", "Production approval package complete"],
    exitCriteria: ["Hypercare exit → maintenance"],
    requiredApproverRoles: ["Executive Sponsor", "Release Manager"],
    requiredDocuments: ["GA announcement", "Support / ops handoff"],
    evidenceRequired: ["Production deploy evidence", "Hypercare plan active"],
  },
  {
    id: "maintenance",
    label: "Maintenance",
    order: 150,
    description: "Post-GA maintenance train; new features require a new release lifecycle.",
    entryCriteria: ["GA hypercare complete or waived"],
    exitCriteria: ["Next release Development state opened"],
    requiredApproverRoles: ["Engineering Lead", "Release Manager"],
    requiredDocuments: ["Maintenance backlog"],
    evidenceRequired: ["Incident trends", "Patch notes"],
  },
];

const BY_ID = new Map(RELEASE_STATES.map((s) => [s.id, s]));

export function getReleaseStateDefinition(id: ReleaseState): ReleaseStateDefinition {
  const def = BY_ID.get(id);
  if (!def) throw new Error(`Unknown release state: ${id}`);
  return def;
}

/** Linear forward path for AcademyOS 1.0 release train. */
export const RELEASE_STATE_SEQUENCE: ReleaseState[] = RELEASE_STATES.map((s) => s.id);

export function nextReleaseStates(current: ReleaseState): ReleaseState[] {
  const idx = RELEASE_STATE_SEQUENCE.indexOf(current);
  if (idx < 0 || idx >= RELEASE_STATE_SEQUENCE.length - 1) return [];
  return [RELEASE_STATE_SEQUENCE[idx + 1]!];
}

export function canTransition(from: ReleaseState, to: ReleaseState): boolean {
  return nextReleaseStates(from).includes(to);
}
