import Link from "next/link";
import { ADMISSIONS_CONTRACT_KINDS } from "@/lib/admissions/experience/constants";
import { portalSectionClass } from "@/components/admissions/portal/styles";

/**
 * Contracts surface — electronic signature hooks via enrollment packet templates.
 * Executed documents are stored through the packet flow + KnowledgeEngine evidence events.
 */
export function ContractsPanel({
  applicationId,
  leadId,
}: {
  applicationId: string;
  leadId: string;
}) {
  return (
    <section className={`${portalSectionClass} space-y-4`}>
      <h2 className="text-lg font-semibold text-slate-900">Contracts & acknowledgements</h2>
      <p className="text-sm text-slate-600">
        Enrollment Agreement, Tuition Agreement, Parent Handbook, and Policy Acceptance use
        existing enrollment packet signature hooks. KnowledgeEngine records executed evidence.
      </p>
      <ul className="space-y-2 text-sm text-slate-700">
        {ADMISSIONS_CONTRACT_KINDS.map((c) => (
          <li
            key={c.key}
            className="flex items-center justify-between gap-2 border-b border-slate-100 py-2"
          >
            <span>{c.label}</span>
            <span className="text-xs text-slate-500">
              {c.signatureHook ? "E-signature hook" : "Acknowledge"}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-sm">
        <Link
          href={`/apply/portal/${applicationId}`}
          className="font-medium text-slate-900 underline"
        >
          Open application for packet signing
        </Link>
        <span className="text-slate-400"> · lead {leadId.slice(0, 8)}…</span>
      </p>
    </section>
  );
}
