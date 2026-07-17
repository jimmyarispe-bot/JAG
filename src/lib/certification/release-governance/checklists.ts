import type { ChecklistDefinition, GateDomain } from "@/lib/certification/release-governance/types";

function item(
  id: string,
  label: string,
  domain: GateDomain,
  evidenceHint: string,
  required = true
) {
  return { id, label, domain, required, evidenceHint };
}

export const GOVERNANCE_CHECKLISTS: ChecklistDefinition[] = [
  {
    id: "rc1_engineering",
    title: "RC1 Engineering Certification",
    phase: "rc1",
    items: [
      item("rc1.arch", "Architecture certification complete", "architecture", "Architecture cert package"),
      item("rc1.sec", "Security certification complete", "security", "Security cert + residual risks"),
      item("rc1.perf", "Performance certification complete", "performance", "Perf report or waiver"),
      item("rc1.test", "Testing certification complete", "testing", "Unit/integration/E2E results"),
      item("rc1.quality", "Code quality (tsc + lint errors)", "testing", "CI logs"),
      item("rc1.db", "Database certification", "operations", "Schema/RLS review notes"),
      item("rc1.migrate", "Migration certification", "deployment", "171/172 apply evidence"),
      item("rc1.deploy", "Deployment certification (staging)", "deployment", "Staging URL + smoke"),
      item("rc1.rollback", "Rollback certification", "rollback", "Rollback rehearsal log"),
      item("rc1.cicd", "CI/CD certification", "testing", "GitHub Actions green"),
      item("rc1.coverage", "Coverage report attached", "testing", "Vitest coverage or waiver"),
      item("rc1.build", "Build validation", "testing", "npm run build log"),
      item("rc1.e2e", "E2E tests (authenticated journeys)", "testing", "Playwright report"),
      item("rc1.mt", "Multi-tenant validation", "security", "Two-org RLS soak"),
      item("rc1.a11y", "Accessibility regression", "accessibility", "axe / WCAG evidence"),
    ],
  },
  {
    id: "rc2_operations",
    title: "RC2 Product / Operations Certification",
    phase: "rc2",
    items: [
      item("rc2.business", "Business validation complete", "operations", "Business validation report"),
      item("rc2.ops", "Operations validation complete", "operations", "Ops checklist signed"),
      item("rc2.training", "Training validation complete", "support", "Training readiness form"),
      item("rc2.support", "Support readiness complete", "support", "Support checklist"),
      item("rc2.workflow", "Workflow validation matrix complete", "testing", "Workflow checklist"),
      item("rc2.docs", "Documentation review complete", "documentation", "Docs checklist"),
      item("rc2.uat", "User acceptance testing logged", "testing", "UAT defect log"),
    ],
  },
  {
    id: "rc3_pilot",
    title: "RC3 Pilot Certification",
    phase: "rc3",
    items: [
      item("rc3.schools", "Pilot schools designated", "operations", "Pilot roster"),
      item("rc3.roles", "Pilot teachers/parents/students/admins active", "operations", "Pilot participation log"),
      item("rc3.perf", "Performance monitored", "performance", "Weekly telemetry"),
      item("rc3.bugs", "Bugs triaged", "testing", "Defect register"),
      item("rc3.support", "Support requests tracked", "support", "Ticket volume report"),
      item("rc3.feedback", "User feedback captured", "support", "Feedback forms"),
      item("rc3.satisfaction", "Satisfaction measured", "support", "Survey summary"),
      item("rc3.usage", "Usage metrics captured", "monitoring", "Usage dashboard export"),
      item("rc3.exit", "Pilot exit criteria met", "operations", "Final pilot report"),
    ],
  },
  {
    id: "rc3_5_dress",
    title: "RC3.5 Production Dress Rehearsal",
    phase: "rc3_5",
    items: [
      item("rc35.deploy", "Production deployment rehearsal", "deployment", "Deploy log"),
      item("rc35.migrate", "Database migration rehearsal", "deployment", "Migrate log"),
      item("rc35.backup", "Backup validation", "backups", "Backup verify log"),
      item("rc35.restore", "Restore validation", "restore", "Restore drill log"),
      item("rc35.monitor", "Monitoring validation", "monitoring", "Monitor screenshots/alerts"),
      item("rc35.alert", "Alert validation", "monitoring", "Test alert receipt"),
      item("rc35.rollback", "Rollback rehearsal", "rollback", "Rollback drill log"),
      item("rc35.dr", "Disaster recovery rehearsal", "disaster_recovery", "DR report"),
      item("rc35.smoke", "Smoke testing on rehearsal env", "testing", "Smoke report"),
      item("rc35.ops", "Operational validation", "operations", "Ops sign-off"),
    ],
  },
  {
    id: "rc4_executive",
    title: "RC4 Executive Go / No-Go",
    phase: "rc4",
    items: [
      item("rc4.arch", "Architecture reviewed", "architecture", "Exec checklist"),
      item("rc4.sec", "Security reviewed", "security", "Exec checklist"),
      item("rc4.perf", "Performance reviewed", "performance", "Exec checklist"),
      item("rc4.ux", "UX / a11y reviewed", "accessibility", "Exec checklist"),
      item("rc4.test", "Testing reviewed", "testing", "Exec checklist"),
      item("rc4.docs", "Documentation reviewed", "documentation", "Exec checklist"),
      item("rc4.ops", "Operations reviewed", "operations", "Exec checklist"),
      item("rc4.support", "Support reviewed", "support", "Exec checklist"),
      item("rc4.training", "Training reviewed", "support", "Exec checklist"),
      item("rc4.pilot", "Pilot results reviewed", "operations", "Pilot final report"),
      item("rc4.risks", "Outstanding risks reviewed", "operations", "Risk register"),
      item("rc4.known", "Known issues reviewed", "documentation", "Known issues register"),
      item("rc4.notes", "Release notes approved", "documentation", "Release notes draft"),
      item("rc4.decision", "Go / No-Go recorded", "operations", "Decision form"),
    ],
  },
  {
    id: "cross_quality_gates",
    title: "Cross-Phase Quality Gates",
    phase: "cross",
    items: (
      [
        "architecture",
        "security",
        "performance",
        "accessibility",
        "testing",
        "documentation",
        "operations",
        "support",
        "monitoring",
        "disaster_recovery",
        "backups",
        "restore",
        "deployment",
        "rollback",
      ] as GateDomain[]
    ).map((domain) =>
      item(`gate.${domain}`, `${domain.replace(/_/g, " ")} gate validated`, domain, `${domain} evidence`)
    ),
  },
];

export function getChecklistDefinition(id: string): ChecklistDefinition {
  const found = GOVERNANCE_CHECKLISTS.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown checklist: ${id}`);
  return found;
}

export function listChecklistIds(): string[] {
  return GOVERNANCE_CHECKLISTS.map((c) => c.id);
}
