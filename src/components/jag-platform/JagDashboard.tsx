import Link from "next/link";
import { ACADEMYOS_LAUNCH_PATH } from "@/lib/jag-platform/auth";
import { JAG_PLATFORM_HEALTH } from "@/lib/jag-platform/health";
import type { JagOrganizationCard } from "@/lib/jag-platform/organizations";
import { JAG_PLATFORM_VERSION } from "@/lib/jag-platform/versioning";

function Card({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function JagDashboard({
  organizations,
}: {
  readonly organizations: readonly JagOrganizationCard[];
}) {
  const health = JAG_PLATFORM_HEALTH;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">The JAG™ Platform</h2>
        <p className="mt-1 text-sm text-slate-600">
          Executive operating system for launching and managing products.
        </p>
      </div>

      <Card title="Executive Intelligence">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "What changed today?",
            "What needs attention?",
            "Risks",
            "Decisions awaiting review",
            "Active investigations",
          ].map((label) => (
            <div
              key={label}
              className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              {label}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Organizations">
        {organizations.length === 0 ? (
          <p className="text-sm text-slate-600">
            No organizations yet.{" "}
            <Link href="/start" className="underline">
              Start Your Pilot
            </Link>
          </p>
        ) : (
          <ul className="space-y-4">
            {organizations.map((org) => (
              <li
                key={org.id}
                className="rounded-lg border border-slate-200 px-4 py-4"
                data-testid="jag-org-card"
                data-org-id={org.id}
                data-org-name={org.name}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {org.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Health: {org.health} · Status: {org.status}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      Products installed:{" "}
                      {org.products.map((p) => p.name).join(", ")}
                    </p>
                  </div>
                  {org.products.some((p) => p.status === "active") ? (
                    <Link
                      href={
                        org.products.find((p) => p.status === "active")
                          ?.launchPath ?? ACADEMYOS_LAUNCH_PATH
                      }
                      className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      Open AcademyOS
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Platform Health">
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-slate-500">Platform Version</dt>
            <dd className="font-medium text-slate-900">
              {JAG_PLATFORM_VERSION.platformVersion}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Schema / API</dt>
            <dd className="font-medium text-slate-900">
              {JAG_PLATFORM_VERSION.schemaVersion} /{" "}
              {JAG_PLATFORM_VERSION.apiVersion}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Marketplace Status</dt>
            <dd className="font-medium text-slate-900">
              {health.marketplaceStatus}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Provider Status</dt>
            <dd className="font-medium text-slate-900">
              {health.providerStatus}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">System Health</dt>
            <dd className="font-medium capitalize text-slate-900">
              {health.systemHealth}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-slate-600">
          Administrators:{" "}
          <Link href="/jag/health" className="underline">
            Open Platform Health dashboard
          </Link>
        </p>
      </Card>

      <Card title="Marketplace">
        <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
          <li>Installed Packs: {health.installedPacks}</li>
          <li>Available Updates: {health.availableUpdates}</li>
          <li>Published Packs: {health.publishedPacks}</li>
        </ul>
      </Card>

      <Card title="Executive Workspace">
        <div className="flex flex-wrap gap-2">
          {[
            "Ask The JAG",
            "Investigate",
            "Compare Organizations",
            "Review Risks",
            "Review Decisions",
          ].map((label) => (
            <button
              key={label}
              type="button"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Buttons only — no AI chat UI in this sprint.
        </p>
      </Card>
    </div>
  );
}
