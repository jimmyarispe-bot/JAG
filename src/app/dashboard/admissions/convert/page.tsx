import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConvertLeadButton } from "@/components/admissions/ConvertLeadButton";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { hasPermission } from "@/lib/platform/identity/authorization-service";
import { formatCount } from "@/lib/format";
import { getConvertibleLeads } from "@/lib/admissions/convertible";

export const metadata = {
  title: "Accepted, not yet on the roster",
  description: "Families who said yes and still have no student record",
};

export const dynamic = "force-dynamic";

/**
 * The bridge between admissions and the student roster.
 *
 * Every student on the roster today arrived by a side door that recorded
 * nothing, because conversion required an admissions_application and no form
 * in the JAG creates one. This screen is the front door, opened.
 *
 * It does not touch money. A family converted here exists as a student and is
 * not billed.
 */
export default async function AdmissionsConvertPage() {
  const identity = await getIdentityContext();
  if (!identity) redirect("/login");

  if (!hasPermission(identity, "admissions.manage") && !hasPermission(identity, "admissions.accept")) {
    const roles = identity.roles?.length ? identity.roles.join(", ") : "none";
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Accepted, not yet on the roster"
          subtitle="You do not have access to this page"
          backHref="/dashboard/admissions"
        />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">
            This page needs <span className="font-mono">admissions.manage</span> or{" "}
            <span className="font-mono">admissions.accept</span>.
          </p>
          <p className="mt-1">
            The roles on your account are: <span className="font-mono">{roles}</span>
          </p>
        </div>
      </div>
    );
  }

  const list = await getConvertibleLeads();

  if (list.unavailable) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          title="Accepted, not yet on the roster"
          subtitle="Families who said yes and still have no student record"
          backHref="/dashboard/admissions"
        />
        {/* The reason, not a zero. An empty list that means "the read was
            refused" is the exact failure this platform keeps getting caught by. */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {list.unavailable}
        </div>
      </div>
    );
  }

  const waiting = list.leads.filter((l) => l.verdict === "create" || l.verdict === "link");
  const ambiguous = list.leads.filter((l) => l.verdict === "ambiguous");
  const done = list.leads.filter((l) => l.verdict === "linked");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Accepted, not yet on the roster"
        subtitle="A family accepted or enrolled in admissions should have a student record. These do not yet."
        backHref="/dashboard/admissions"
      />

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">What these buttons do, and do not do.</p>
        <p className="mt-1">
          They create the student, the family, the guardian and the enrolment, and they record the
          conversion so the Admissions, Documents and Scholarships tabs on that student stop being
          empty. They do <span className="font-semibold">not</span> activate the student, do{" "}
          <span className="font-semibold">not</span> create a tuition plan, do{" "}
          <span className="font-semibold">not</span> bill anyone, and do{" "}
          <span className="font-semibold">not</span> invite the parent to the portal. Tuition stays
          exactly where it is today: manual.
        </p>
      </div>

      {list.leads.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          No lead is sitting at accepted or enrolled. Every family who said yes is on the roster.
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{formatCount(waiting.length)}</span> ready ·{" "}
          <span className="font-semibold text-rose-700">{formatCount(ambiguous.length)}</span> need a
          person · <span className="font-semibold text-emerald-700">{formatCount(done.length)}</span>{" "}
          already done
        </div>
      )}

      {list.leads.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Campus</th>
                <th className="px-4 py-3">Parent</th>
                <th className="px-4 py-3">What this will do</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...waiting, ...ambiguous, ...done].map((l) => (
                <tr key={l.leadId} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{l.studentName}</div>
                    <div className="text-xs text-slate-500">{l.leadStage.replace(/_/g, " ")}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{l.campus}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-900">{l.guardianName ?? "—"}</div>
                    {l.guardianEmail ? (
                      <div className="text-xs">
                        <a className="text-brand-600 hover:underline" href={`mailto:${l.guardianEmail}`}>
                          {l.guardianEmail}
                        </a>
                      </div>
                    ) : (
                      <div className="text-xs text-rose-600">no email on file</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        l.verdict === "ambiguous"
                          ? "text-rose-700"
                          : l.verdict === "linked"
                            ? "text-emerald-700"
                            : "text-slate-600"
                      }
                    >
                      {l.verdictNote}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {l.verdict === "create" || l.verdict === "link" ? (
                        <ConvertLeadButton
                          leadId={l.leadId}
                          mode={l.verdict}
                          studentName={l.studentName}
                        />
                      ) : null}
                      <Link
                        href={l.caseHref}
                        className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
                      >
                        Open case
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
