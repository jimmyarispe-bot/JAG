import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { hasPermission } from "@/lib/platform/identity/authorization-service";
import type { PermissionKey } from "@/lib/platform/identity/types";
import { inspectInterestForms } from "@/lib/admissions/interest-form/inspect";
import { describeCondition } from "@/lib/admissions/interest-form/describe";
import { FormWordingEditor } from "@/components/admissions/FormWordingEditor";
import { OpenFormDraftButton } from "@/components/admissions/OpenFormDraftButton";

export const metadata = {
  title: "Forms",
  description: "Every question the live form asks, section by section",
};

export const dynamic = "force-dynamic";

const FORM_BUILDER_PERMISSION: PermissionKey = "FORM_BUILDER_ACCESS";

const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

/**
 * What the form actually asks.
 *
 * SHIP ONE: READ ONLY, ON PURPOSE. The form is on version 22 because every
 * wording change has been a migration. The builder is four ships; this is the
 * first, and it earns its place before any edit button exists - nobody should
 * change a question they cannot first see in one place.
 *
 * WHAT A PERSON NEEDS FROM THIS PAGE: which campus sees which section, what
 * each question is called, whether it is required, and what the choices are.
 * Those are the four things every request to me this month has been about.
 */
export default async function FormsPage() {
  const identity = await getIdentityContext();
  if (!identity) redirect("/login");

  /*
   * SAY NO OUT LOUD - the same refusal the admissions contacts page uses, and
   * for the same reason: a redirect to /dashboard is indistinguishable from a
   * broken link, and cost an hour once already.
   */
  if (!hasPermission(identity, FORM_BUILDER_PERMISSION)) {
    const roles = identity.roles?.length ? identity.roles.join(", ") : "none";
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Forms"
          subtitle="You do not have access to this page"
          backHref="/dashboard/admin"
        />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">
            This page needs the <span className="font-mono">{FORM_BUILDER_PERMISSION}</span>{" "}
            permission.
          </p>
          <p className="mt-1">
            Your roles: {roles}. Editing the forms families fill in is limited to Jimmy and
            Danni.
          </p>
        </div>
      </div>
    );
  }

  const { forms, unavailable } = await inspectInterestForms();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Forms"
        subtitle="Every question the live form asks, section by section"
        backHref="/dashboard/admin"
      />

      {unavailable ? (
        /* The reason, never an empty page pretending to be an empty form. */
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {unavailable}
        </div>
      ) : null}

      {!unavailable && forms.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">
          No form has been created for this organization yet.
        </div>
      ) : null}

      {forms.map((form) => {
        const live = form.versions.find((v) => v.id === form.publishedVersionId) ?? null;
        const draft = form.versions.find((v) => v.id === form.draftVersionId) ?? null;
        const definition = live?.definition ?? null;

        const questionByKey = new Map(
          (definition?.questions ?? []).map((q) => [q.key, q])
        );
        const labels = {
          values: form.schoolNames,
          paths: Object.fromEntries(
            (definition?.questions ?? []).map((q) => [q.key, q.label])
          ),
        };

        const orphanQuestions = (definition?.questions ?? []).filter(
          (q) =>
            !(definition?.sections ?? []).some((s) => s.questionKeys.includes(q.key))
        );

        return (
          <div key={form.formId} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{form.title}</h2>
                <p className="text-sm text-slate-500">{form.organizationName}</p>
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-slate-500">Live version</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {live ? `v${live.versionNumber}` : "none published"}
                  </p>
                  <p className="text-xs text-slate-400">
                    published {when(live?.publishedAt ?? null)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Working draft</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {draft ? `v${draft.versionNumber}` : "none"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Versions kept</p>
                  <p className="text-xl font-semibold text-slate-900">{form.versions.length}</p>
                  <p className="text-xs text-slate-400">every one still readable</p>
                </div>
              </div>
            </div>

            {/*
              * EDITING HAPPENS ON A DRAFT, AND THE SCREEN SHOWS WHICH.
              *
              * With a draft open, the editor replaces the read-only view -
              * two versions of the same form side by side is how somebody
              * edits one and reads the other. Without one, the live form is
              * shown as it is, with one button to start changing its words.
              */}
            {draft?.definition ? (
              <FormWordingEditor
                formId={form.formId}
                draftVersionNumber={draft.versionNumber}
                definition={draft.definition}
                campusNames={form.schoolNames}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-sm text-slate-600">
                  Changing a word opens a working draft. Families keep seeing the live version
                  until you publish it.
                </p>
                <OpenFormDraftButton formId={form.formId} />
              </div>
            )}

            {live?.problem ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {live.problem}
              </div>
            ) : null}

            {definition && !draft
              ? [...definition.sections]
                  .sort((a, b) => a.order - b.order)
                  .map((section) => {
                    const rule = describeCondition(section.visibleWhen, labels);
                    return (
                      <section
                        key={section.key}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                      >
                        <header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="font-semibold text-slate-900">{section.title}</h3>
                            <span className="font-mono text-xs text-slate-400">
                              {section.key}
                            </span>
                          </div>
                          {section.description ? (
                            <p className="mt-1 text-sm text-slate-600">{section.description}</p>
                          ) : null}
                          {/* WHO SEES THIS SECTION, in words rather than in a
                              condition tree. "Always shown" is stated rather
                              than implied by the absence of a line. */}
                          <p className="mt-1 text-xs text-slate-500">
                            {rule ? `Shown when ${rule}` : "Always shown"}
                          </p>
                        </header>

                        <table className="min-w-full divide-y divide-slate-100 text-sm">
                          <tbody className="divide-y divide-slate-100">
                            {section.questionKeys.map((key) => {
                              const q = questionByKey.get(key);
                              if (!q) {
                                return (
                                  <tr key={key}>
                                    <td
                                      className="px-5 py-3 text-amber-800"
                                      colSpan={3}
                                    >
                                      This section lists{" "}
                                      <span className="font-mono">{key}</span>, and the form has
                                      no such question.
                                    </td>
                                  </tr>
                                );
                              }
                              const qRule = describeCondition(q.visibleWhen, labels);
                              return (
                                <tr key={key} className="align-top">
                                  <td className="px-5 py-3">
                                    <div className="font-medium text-slate-900">
                                      {q.label}
                                      {q.required ? (
                                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-normal text-slate-600">
                                          required
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="font-mono text-xs text-slate-400">
                                      {q.key}
                                    </div>
                                    {q.helpText ? (
                                      <div className="mt-1 text-xs text-slate-500">
                                        {q.helpText}
                                      </div>
                                    ) : null}
                                    {qRule ? (
                                      <div className="mt-1 text-xs text-slate-500">
                                        Shown when {qRule}
                                      </div>
                                    ) : null}
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                                    {q.type}
                                  </td>
                                  <td className="px-5 py-3 text-slate-600">
                                    {q.optionSource ? (
                                      <span className="text-slate-500">
                                        choices from {q.optionSource}
                                      </span>
                                    ) : q.options && q.options.length > 0 ? (
                                      <span>{q.options.map((o) => o.label).join(", ")}</span>
                                    ) : (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </section>
                    );
                  })
              : null}

            {/* A question nobody can answer because no section carries it.
                Printed, because it is invisible everywhere else. */}
            {orphanQuestions.length > 0 && !draft ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                <p className="font-medium">
                  {orphanQuestions.length} question
                  {orphanQuestions.length === 1 ? " is" : "s are"} defined but in no section, so
                  no family is ever asked{" "}
                  {orphanQuestions.length === 1 ? "it" : "them"}:
                </p>
                <ul className="mt-1 space-y-0.5">
                  {orphanQuestions.map((q) => (
                    <li key={q.key}>
                      {q.label} <span className="font-mono text-xs">({q.key})</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <details className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm">
              <summary className="cursor-pointer font-medium text-slate-900">
                Version history ({form.versions.length})
              </summary>
              <table className="mt-3 min-w-full divide-y divide-slate-100">
                <tbody className="divide-y divide-slate-100">
                  {form.versions.map((v) => (
                    <tr key={v.id}>
                      <td className="py-2 pr-4 font-medium text-slate-900">v{v.versionNumber}</td>
                      <td className="py-2 pr-4 text-slate-600">{v.lifecycle}</td>
                      <td className="py-2 pr-4 text-slate-500">created {when(v.createdAt)}</td>
                      <td className="py-2 text-slate-500">
                        {v.problem ? (
                          <span className="text-amber-800">{v.problem}</span>
                        ) : (
                          `${v.definition?.sections.length ?? 0} sections, ${
                            v.definition?.questions.length ?? 0
                          } questions`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </div>
        );
      })}
    </div>
  );
}
