import { buildLearningProgressSummary } from "./dashboard";
import { listStudents } from "../sis/store";
import {
  listAssessments,
  listInterventions,
  listMastery,
} from "./store";
import { createLearningProfileService } from "./profile";

export type LearningReportKind =
  | "student_progress"
  | "mastery_distribution"
  | "reading_levels"
  | "writing_levels"
  | "math_levels"
  | "structured_literacy_progress"
  | "intervention_summary"
  | "assessment_completion"
  | "growth_trends";

export type LearningReport = {
  readonly kind: LearningReportKind;
  readonly organizationId: string;
  readonly generatedAt: string;
  readonly rows: readonly Record<string, string | number>[];
  readonly csv: string;
  readonly pdf: string;
};

function toCsv(rows: readonly Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\n");
}

function toPdf(title: string, lines: readonly string[]): string {
  const contentLines = [title, "", ...lines].map((l) =>
    l.replace(/[()\\]/g, "")
  );
  const stream =
    "BT /F1 10 Tf 50 750 Td " +
    contentLines
      .map((l, i) => (i === 0 ? `(${l}) Tj` : `0 -14 Td (${l}) Tj`))
      .join(" ") +
    " ET";
  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n",
    `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj\n`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefPos = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return pdf;
}

function domainRows(
  organizationId: string,
  domain: string
): Record<string, string | number>[] {
  return listMastery(organizationId)
    .filter((m) => m.domain === domain)
    .map((m) => ({
      studentId: m.studentId,
      level: m.progressionLevel ?? "",
      step: m.progressionStep ?? "",
      mastery: m.level,
    }));
}

export function createLearningReportingService() {
  return {
    generate(
      organizationId: string,
      kind: LearningReportKind
    ): LearningReport {
      const generatedAt = new Date().toISOString();
      const summary = buildLearningProgressSummary(organizationId);
      let rows: Record<string, string | number>[] = [];
      let title: string = kind;

      switch (kind) {
        case "student_progress": {
          title = "Student Progress";
          const profiles = createLearningProfileService();
          rows = listStudents(organizationId).map((s) => {
            const p = profiles.get({
              organizationId,
              studentId: s.id,
            });
            if ("error" in p) {
              return {
                studentId: s.id,
                name: s.identity.preferredName,
                reading: "",
                writing: "",
                math: "",
                structuredLiteracy: "",
                growth: 0,
              };
            }
            return {
              studentId: s.id,
              name: s.identity.preferredName,
              reading: p.reading.level ?? "",
              writing: p.writing.level ?? "",
              math: p.math.level ?? "",
              structuredLiteracy: p.structuredLiteracy.level ?? "",
              growth: p.growth.netLevelChanges,
            };
          });
          break;
        }
        case "mastery_distribution":
          title = "Mastery Distribution";
          rows = Object.entries(summary.masteryDistribution).map(
            ([level, count]) => ({ level, count })
          );
          break;
        case "reading_levels":
          title = "Reading Levels";
          rows = domainRows(organizationId, "Reading");
          break;
        case "writing_levels":
          title = "Writing Levels";
          rows = domainRows(organizationId, "Writing");
          break;
        case "math_levels":
          title = "Math Levels";
          rows = domainRows(organizationId, "Math");
          break;
        case "structured_literacy_progress":
          title = "Structured Literacy Progress";
          rows = domainRows(organizationId, "Structured Literacy");
          break;
        case "intervention_summary":
          title = "Intervention Summary";
          rows = listInterventions(organizationId).map((i) => ({
            studentId: i.studentId,
            kind: i.kind,
            status: i.status,
            startsOn: i.startsOn,
            reviewOn: i.reviewOn ?? "",
            outcome: i.outcome,
          }));
          break;
        case "assessment_completion":
          title = "Assessment Completion";
          rows = [
            {
              assessments: listAssessments(organizationId).length,
              completionRate: summary.assessmentCompletionRate,
              studentsMastering: summary.studentsMasteringObjectives,
            },
          ];
          break;
        case "growth_trends":
          title = "Growth Trends";
          rows = [
            {
              growthTrendPercent: summary.growthTrendPercent,
              literacyAverage: summary.literacyProgressionAverage,
              graduationReadiness: summary.graduationReadinessAverage,
            },
          ];
          break;
      }

      const lines = rows.slice(0, 40).map((r) =>
        Object.entries(r)
          .map(([k, v]) => `${k}=${v}`)
          .join(" | ")
      );
      return {
        kind,
        organizationId,
        generatedAt,
        rows: Object.freeze(rows),
        csv: toCsv(rows),
        pdf: toPdf(title, lines),
      };
    },
  };
}
