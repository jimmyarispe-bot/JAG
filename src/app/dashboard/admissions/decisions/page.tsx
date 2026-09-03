import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PendingDecisionsPanel } from "@/components/admissions/PendingDecisionsPanel";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { hasPermission } from "@/lib/platform/identity/authorization-service";
import { listPendingGates } from "@/lib/admissions/gates/actions";

export const metadata = {
  title: "Decisions waiting",
  description: "Admissions decisions waiting on a school leader",
};

export const dynamic = "force-dynamic";

export default async function AdmissionsDecisionsPage() {
  const identity = await getIdentityContext();
  if (!identity) redirect("/login");

  /**
   * Viewing needs admissions.view; answering needs admissions.accept, enforced
   * again inside the action. Someone who can see a decision but not make it gets
   * the page in read-only rather than a redirect that looks like a broken link.
   */
  if (!hasPermission(identity, "admissions.view")) {
    const roles = identity.roles?.length ? identity.roles.join(", ") : "none";
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Decisions waiting"
          subtitle="You do not have access to this page"
          backHref="/dashboard"
        />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">
            This page needs the <span className="font-mono">admissions.view</span> permission.
          </p>
          <p className="mt-1">
            The roles on your account are: <span className="font-mono">{roles}</span>
          </p>
        </div>
      </div>
    );
  }

  const result = await listPendingGates();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Decisions waiting"
        subtitle="Each one holds a family in place until you answer"
        backHref="/dashboard/admissions"
      />

      {"error" in result ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {result.error}
        </div>
      ) : (
        <>
          {!hasPermission(identity, "admissions.accept") ? (
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              You can see these decisions but not answer them — that needs the{" "}
              <span className="font-mono">admissions.accept</span> permission.
            </div>
          ) : null}
          <PendingDecisionsPanel initial={result.gates} />
        </>
      )}
    </div>
  );
}
