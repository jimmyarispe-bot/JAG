import Link from "next/link";
import type { JagCapabilitiesWorkspaceModel } from "@/lib/jag-command-center/capabilities";
import { JagEmptyState } from "../JagEmptyState";
import { JagSection } from "../JagSection";
import { JagStatusBadge } from "../JagStatusBadge";

export function JagCapabilitiesView({
  model,
}: {
  readonly model: JagCapabilitiesWorkspaceModel;
}) {
  const selected =
    model.capabilities.find((c) => c.id === model.selectedId) ?? null;

  return (
    <div className="space-y-8">
      <JagSection
        title="Intelligence Capabilities"
        description="Self-describing capability registry — navigation, search, conversation, briefings, and watchers discover themselves."
      >
        <p className="text-xs text-[var(--jag-muted)]">{model.advisoryNotice}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-[var(--jag-muted)]">Installed</dt>
            <dd className="text-lg text-[var(--jag-text)]">
              {model.capabilities.length}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">Healthy</dt>
            <dd className="text-lg text-[var(--jag-text)]">
              {model.healthDashboard.filter((h) => h.status === "healthy").length}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">Dependency issues</dt>
            <dd className="text-lg text-[var(--jag-text)]">
              {model.dependencyIssues.length}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">Nav items</dt>
            <dd className="text-lg text-[var(--jag-text)]">
              {model.navigation.length}
            </dd>
          </div>
        </dl>
      </JagSection>

      {model.dependencyIssues.length > 0 ? (
        <JagSection
          title="Dependency validation"
          description="Missing, version mismatch, circular, disabled, or provider conflicts."
        >
          <ul className="space-y-2 text-xs text-[var(--jag-muted)]">
            {model.dependencyIssues.map((issue, i) => (
              <li
                key={`${issue.kind}-${issue.capabilityId}-${i}`}
                className="rounded border border-[var(--jag-border)] px-3 py-2"
              >
                <span className="uppercase tracking-wide text-[var(--jag-text)]">
                  {issue.kind.replace(/_/g, " ")}
                </span>
                <p className="mt-1">{issue.detail}</p>
              </li>
            ))}
          </ul>
        </JagSection>
      ) : null}

      <JagSection
        title="Installed capabilities"
        description="Status, version, health, and providers."
      >
        {model.capabilities.length === 0 ? (
          <JagEmptyState
            title="No capabilities registered"
            description="Bootstrap the Capability SDK to register Phase II intelligence modules."
          />
        ) : (
          <ul className="space-y-2">
            {model.capabilities.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/jag/capabilities?id=${encodeURIComponent(c.id)}`}
                  className={`block rounded border px-3 py-2 text-sm ${
                    selected?.id === c.id
                      ? "border-[var(--jag-text)] bg-[var(--jag-panel)]"
                      : "border-[var(--jag-border)]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-[var(--jag-text)]">{c.name}</p>
                    <span className="text-[10px] uppercase tracking-wide text-[var(--jag-muted)]">
                      v{c.version} · {c.health}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--jag-muted)]">
                    {c.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </JagSection>

      {selected ? (
        <JagSection
          title={selected.name}
          description={`${selected.id} · lifecycle ${selected.status}`}
        >
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <JagStatusBadge
                status={selected.health === "healthy" ? "ready" : "empty"}
              />
              <span className="text-xs text-[var(--jag-muted)]">
                {selected.healthSummary}
              </span>
            </div>
            <p className="text-xs text-[var(--jag-muted)]">
              Category {selected.category}
              {selected.sprint ? ` · Sprint ${selected.sprint}` : ""}
              {selected.enabled ? "" : " · disabled"}
            </p>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--jag-muted)]">
                Routes
              </p>
              <ul className="mt-1 list-disc pl-5 text-xs text-[var(--jag-muted)]">
                {selected.routes.map((r) => (
                  <li key={r.path}>
                    <Link
                      href={r.path}
                      className="text-[var(--jag-text)] underline-offset-2 hover:underline"
                    >
                      {r.label}
                    </Link>{" "}
                    · {r.path}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--jag-muted)]">
                Dependencies
              </p>
              {selected.dependencies.length === 0 ? (
                <p className="mt-1 text-xs text-[var(--jag-muted)]">None</p>
              ) : (
                <ul className="mt-1 list-disc pl-5 text-xs text-[var(--jag-muted)]">
                  {selected.dependencies.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--jag-muted)]">
                Providers
              </p>
              <p className="mt-1 text-xs text-[var(--jag-muted)]">
                {selected.providers.length
                  ? selected.providers.join(", ")
                  : "None"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--jag-muted)]">
                Feature flags
              </p>
              <ul className="mt-1 list-disc pl-5 text-xs text-[var(--jag-muted)]">
                {Object.entries(selected.featureFlags).map(([k, v]) => (
                  <li key={k}>
                    {k}: {v ? "on" : "off"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </JagSection>
      ) : null}

      <JagSection
        title="Discovered providers"
        description="Conversation intents, briefing sections, and watcher sources from the registry."
      >
        <div className="grid gap-4 text-xs sm:grid-cols-3">
          <div>
            <p className="uppercase tracking-wide text-[var(--jag-muted)]">
              Conversation
            </p>
            <ul className="mt-2 space-y-1 text-[var(--jag-muted)]">
              {model.conversationIntents.map((p) => (
                <li key={p.capabilityId}>
                  {p.capabilityId}: {p.intents.join(", ")}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="uppercase tracking-wide text-[var(--jag-muted)]">
              Briefings
            </p>
            <ul className="mt-2 space-y-1 text-[var(--jag-muted)]">
              {model.briefingSections.map((p) => (
                <li key={p.capabilityId}>
                  {p.capabilityId}: {p.sectionIds.join(", ")}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="uppercase tracking-wide text-[var(--jag-muted)]">
              Watchers
            </p>
            <ul className="mt-2 space-y-1 text-[var(--jag-muted)]">
              {model.watcherSources.map((p) => (
                <li key={p.capabilityId}>
                  {p.capabilityId}: {p.watcherTypes.length} type(s)
                </li>
              ))}
            </ul>
          </div>
        </div>
      </JagSection>
    </div>
  );
}
