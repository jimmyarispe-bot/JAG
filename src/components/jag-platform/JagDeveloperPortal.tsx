"use client";

import { useRouter } from "next/navigation";
import type { getPlatformSdk } from "@/lib/platform-sdk";

type Snapshot = ReturnType<
  ReturnType<typeof getPlatformSdk>["getDeveloperSnapshot"]
>;

type OrgOption = { readonly id: string; readonly name: string };

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
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

export function JagDeveloperPortal({
  organizations,
  organizationId,
  organizationName,
  snapshot,
}: {
  readonly organizations: readonly OrgOption[];
  readonly organizationId: string;
  readonly organizationName: string;
  readonly snapshot: Snapshot;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            The JAG™
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Developer Portal
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Read-only view of the Platform SDK™, Extension Framework™, and
            registered integration surfaces for {organizationName}.
          </p>
        </div>
        <label className="text-sm text-slate-600">
          Organization
          <select
            className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5"
            value={organizationId}
            onChange={(e) => {
              router.push(`/jag/developer?org=${encodeURIComponent(e.target.value)}`);
            }}
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Section title="SDK Version">
          <p className="text-2xl font-semibold text-slate-900">
            {snapshot.sdkVersion}
          </p>
        </Section>
        <Section title="Platform Version">
          <p className="text-2xl font-semibold text-slate-900">
            {snapshot.platformVersion}
          </p>
        </Section>
        <Section title="Installed Extensions">
          <p className="text-2xl font-semibold text-slate-900">
            {snapshot.installedExtensions.length}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {snapshot.installedExtensions.length === 0 ? (
              <li>None installed</li>
            ) : (
              snapshot.installedExtensions.map((ext) => (
                <li key={ext.manifest.id}>
                  {ext.manifest.name} v{ext.installedVersion} — {ext.status}
                </li>
              ))
            )}
          </ul>
        </Section>
      </div>

      <Section title="Available Interfaces">
        <ul className="grid gap-1 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
          {snapshot.interfaces.map((iface) => (
            <li key={`${iface.module}.${iface.name}`}>
              <span className="font-medium">{iface.name}</span>
              <span className="text-slate-500"> · {iface.module}</span>
            </li>
          ))}
        </ul>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Registered Connectors">
          <ul className="space-y-2 text-sm text-slate-700">
            {snapshot.connectors.map((c) => (
              <li key={c.id}>
                <span className="font-medium">{c.id}</span> v{c.version}
                <span className="text-slate-500">
                  {" "}
                  — {c.capabilities().operations.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Registered Twin Entities">
          <ul className="max-h-64 space-y-1 overflow-y-auto text-sm text-slate-700">
            {snapshot.twinEntityTypes.map((t) => (
              <li key={t.entityType}>
                {t.entityType}{" "}
                <span className="text-slate-500">v{t.version}</span>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Registered Insight Providers">
          {snapshot.insightProviders.length === 0 ? (
            <p className="text-sm text-slate-600">None registered</p>
          ) : (
            <ul className="space-y-1 text-sm text-slate-700">
              {snapshot.insightProviders.map((p) => (
                <li key={p.id}>
                  {p.id} v{p.version}
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Registered Decision Providers">
          {snapshot.decisionProviders.length === 0 ? (
            <p className="text-sm text-slate-600">None registered</p>
          ) : (
            <ul className="space-y-1 text-sm text-slate-700">
              {snapshot.decisionProviders.map((p) => (
                <li key={p.id}>
                  {p.label} ({p.id}) v{p.version}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Validation Results">
        <ul className="space-y-2 text-sm">
          {snapshot.validationResults.map((row) => (
            <li
              key={row.target}
              className={row.ok ? "text-emerald-700" : "text-rose-700"}
            >
              <span className="font-medium">{row.target}</span>
              {row.ok ? " — ok" : ` — ${row.errors.join("; ")}`}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
