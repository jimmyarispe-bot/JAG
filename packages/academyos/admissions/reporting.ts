import { listApplicants, listDocuments } from "./store";
import { buildAdmissionsDashboard, buildAdmissionsSummary } from "./dashboard";
import { ADMISSIONS_STAGES, type AdmissionsStage } from "./types";
import { listTimeline } from "./store";

export type AdmissionsReportKind =
  | "admissions_funnel"
  | "enrollment_by_campus"
  | "enrollment_by_program"
  | "scholarship_awards"
  | "outstanding_documents"
  | "enrollment_conversion"
  | "time_in_stage";

export type AdmissionsReport = {
  readonly kind: AdmissionsReportKind;
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

/** Minimal valid single-page PDF with plain text lines. */
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

export function createAdmissionsReportingService() {
  return {
    generate(
      organizationId: string,
      kind: AdmissionsReportKind
    ): AdmissionsReport {
      const generatedAt = new Date().toISOString();
      const dash = buildAdmissionsDashboard(organizationId);
      const summary = buildAdmissionsSummary(organizationId);
      let rows: Record<string, string | number>[] = [];
      let title: string = kind;

      switch (kind) {
        case "admissions_funnel":
          title = "Admissions Funnel";
          rows = ADMISSIONS_STAGES.map((s) => ({
            stage: s,
            count: dash.pipelineByStage[s],
          }));
          break;
        case "enrollment_by_campus":
          title = "Enrollment by Campus";
          rows = Object.entries(summary.enrollmentByCampus).map(
            ([campus, count]) => ({ campus, count })
          );
          break;
        case "enrollment_by_program":
          title = "Enrollment by Program";
          rows = Object.entries(summary.enrollmentByProgram).map(
            ([program, count]) => ({ program, count })
          );
          break;
        case "scholarship_awards":
          title = "Scholarship Awards";
          rows = listApplicants(organizationId)
            .filter((a) => a.scholarshipStatus === "Awarded")
            .map((a) => ({
              applicantId: a.id,
              student: `${a.student.firstName} ${a.student.lastName}`,
              amount: a.scholarshipAmount,
              program: a.program,
            }));
          break;
        case "outstanding_documents":
          title = "Outstanding Documents";
          rows = listDocuments(organizationId)
            .filter((d) => d.status !== "Approved")
            .map((d) => ({
              documentId: d.id,
              applicantId: d.applicantId,
              type: d.type,
              status: d.status,
            }));
          break;
        case "enrollment_conversion":
          title = "Enrollment Conversion";
          rows = [
            { metric: "Inquiries", value: listApplicants(organizationId).length },
            { metric: "Enrolled", value: dash.pipelineByStage.Enrolled },
            { metric: "ConversionRatePercent", value: dash.conversionRate },
            {
              metric: "AverageDaysInPipeline",
              value: dash.averageDaysInPipeline,
            },
          ];
          break;
        case "time_in_stage": {
          title = "Time in Stage";
          const stageDays: Record<string, number[]> = {};
          for (const a of listApplicants(organizationId)) {
            const events = listTimeline(organizationId, a.id).filter(
              (e) => e.kind === "stage_changed"
            );
            for (const e of events) {
              const to = e.metadata.to as AdmissionsStage | undefined;
              if (!to) continue;
              const days =
                (Date.parse(e.at) - Date.parse(a.inquiredAt)) /
                (1000 * 60 * 60 * 24);
              stageDays[to] = stageDays[to] ?? [];
              stageDays[to]!.push(Math.max(0, days));
            }
          }
          rows = Object.entries(stageDays).map(([stage, vals]) => ({
            stage,
            averageDaysFromInquiry:
              Math.round(
                (vals.reduce((s, v) => s + v, 0) / vals.length) * 10
              ) / 10,
            samples: vals.length,
          }));
          break;
        }
      }

      const csv = toCsv(rows);
      const pdf = toPdf(
        title,
        rows.map((r) =>
          Object.entries(r)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" | ")
        )
      );

      return {
        kind,
        organizationId,
        generatedAt,
        rows: Object.freeze(rows),
        csv,
        pdf,
      };
    },
  };
}
