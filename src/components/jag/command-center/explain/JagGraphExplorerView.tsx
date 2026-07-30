import Link from "next/link";
import type { JagGraphWorkspaceModel } from "@/lib/jag-command-center/explain";
import { nodeKindLabel } from "@/lib/jag-command-center/explain";
import { JagEmptyState } from "../JagEmptyState";
import { JagSection } from "../JagSection";
import { JagStatusBadge } from "../JagStatusBadge";
import { JagExplainPanel } from "./JagExplainPanel";

export function JagGraphExplorerView({
  model,
}: {
  readonly model: JagGraphWorkspaceModel;
}) {
  const graph = model.graph;
  const focus = model.focusNodeId;

  return (
    <div className="space-y-8">
      <JagSection
        title="Intelligence Graph"
        description="Executive reasoning map — evidence to outcomes. Not a graph database."
        actions={
          <div className="flex flex-wrap gap-3 text-xs">
            <Link
              href="/jag/chat"
              className="text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
            >
              Ask why
            </Link>
            <Link
              href="/jag/capabilities"
              className="text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
            >
              Capabilities
            </Link>
          </div>
        }
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">{model.advisoryNotice}</p>
          <JagStatusBadge
            status={graph && graph.nodes.length > 0 ? "ready" : "empty"}
          />
        </div>
        <p className="text-xs text-[var(--jag-muted)]">{model.explanation}</p>

        {model.organizations.length > 1 ? (
          <form method="get" className="mt-3 flex flex-wrap items-end gap-2 text-xs">
            <label className="space-y-1">
              <span className="text-[var(--jag-muted)]">Organization</span>
              <select
                name="org"
                defaultValue={model.organizationId ?? ""}
                className="ml-2 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              >
                {model.organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <FilterFields model={model} />
            <button
              type="submit"
              className="rounded border border-[var(--jag-border)] px-2 py-1.5 text-[var(--jag-text)]"
            >
              Apply
            </button>
          </form>
        ) : model.organizationName ? (
          <form method="get" className="mt-3 flex flex-wrap items-end gap-2 text-xs">
            <input type="hidden" name="org" value={model.organizationId ?? ""} />
            <p className="w-full text-sm text-[var(--jag-text)]">
              Organization · {model.organizationName}
            </p>
            <FilterFields model={model} />
            <button
              type="submit"
              className="rounded border border-[var(--jag-border)] px-2 py-1.5 text-[var(--jag-text)]"
            >
              Apply
            </button>
          </form>
        ) : null}

        {graph?.breadcrumb.length ? (
          <nav className="mt-3 flex flex-wrap items-center gap-1 text-xs text-[var(--jag-muted)]">
            <Link
              href={hrefFor(model, { focus: undefined })}
              className="hover:text-[var(--jag-text)]"
            >
              All
            </Link>
            {graph.breadcrumb.map((b) => (
              <span key={b.id} className="flex items-center gap-1">
                <span>/</span>
                <Link
                  href={hrefFor(model, { focus: b.id })}
                  className="text-[var(--jag-text)] hover:underline"
                >
                  {b.label}
                </Link>
              </span>
            ))}
          </nav>
        ) : null}
      </JagSection>

      {!model.organizationId || !graph ? (
        <JagEmptyState
          title="No organization scope"
          description="Bind an organization to explore goals, memory, alerts, and capabilities as a reasoning map."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <JagSection
            title="Reasoning map"
            description={
              graph.truncated
                ? "Lazy-loaded / virtualized view — deepen focus or raise depth to expand."
                : "Nodes and relationships from bound intelligence services."
            }
            actions={
              <div className="flex flex-wrap gap-2 text-xs">
                <Link
                  href={hrefFor(model, {
                    depth: String(Math.min(4, model.query.depth + 1)),
                  })}
                  className="text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
                >
                  Expand depth
                </Link>
                <Link
                  href={hrefFor(model, {
                    depth: String(Math.max(1, model.query.depth - 1)),
                  })}
                  className="text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
                >
                  Collapse
                </Link>
                {focus ? (
                  <Link
                    href={hrefFor(model, { focus: undefined })}
                    className="text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
                  >
                    Exit focus
                  </Link>
                ) : null}
              </div>
            }
          >
            {graph.nodes.length === 0 ? (
              <JagEmptyState
                title="No matching nodes"
                description="Relax filters or clear search to see the organization reasoning map."
              />
            ) : (
              <ul className="max-h-[36rem] space-y-2 overflow-y-auto pr-1">
                {graph.nodes.map((n) => {
                  const active = n.id === focus;
                  return (
                    <li key={n.id}>
                      <Link
                        href={hrefFor(model, { focus: n.id })}
                        className={`block rounded-md border px-3 py-2 transition-colors ${
                          active
                            ? "border-[var(--jag-text)] bg-[var(--jag-panel)]"
                            : "border-[var(--jag-border)] hover:border-[var(--jag-muted)]"
                        }`}
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm text-[var(--jag-text)]">{n.label}</p>
                          <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
                            {nodeKindLabel(n.kind)}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--jag-muted)]">
                          {n.summary}
                        </p>
                        {typeof n.confidence === "number" ? (
                          <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                            conf {(n.confidence * 100).toFixed(0)}%
                          </p>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {graph.edges.length > 0 ? (
              <div className="mt-4 border-t border-[var(--jag-border)] pt-3">
                <p className="mb-2 text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
                  Relationships ({graph.edges.length})
                </p>
                <ul className="max-h-48 space-y-1 overflow-y-auto text-[11px] text-[var(--jag-muted)]">
                  {graph.edges.slice(0, 40).map((e) => (
                    <li key={e.id}>
                      <span className="text-[var(--jag-text)]">{e.label}</span>
                      {" · "}
                      {e.kind.replace(/_/g, " ")}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </JagSection>

          <JagSection
            title="Node details"
            description="Summary, confidence, evidence, and related reasoning."
          >
            {model.selected ? (
              <div className="space-y-3">
                <JagExplainPanel
                  explanation={model.selected}
                  defaultOpen
                  graphHref={hrefFor(model, {
                    focus: model.selected.subjectId,
                  })}
                />
                {graph.nodes.find((n) => n.id === focus)?.href ? (
                  <Link
                    href={graph.nodes.find((n) => n.id === focus)!.href!}
                    className="inline-block text-xs text-[var(--jag-text)] underline-offset-2 hover:underline"
                  >
                    Open source surface
                  </Link>
                ) : null}
              </div>
            ) : (
              <JagEmptyState
                title="Select a node"
                description="Focus any node to see why it exists, what evidence supports it, and related goals, decisions, and memory."
              />
            )}
          </JagSection>
        </div>
      )}
    </div>
  );
}

function FilterFields({ model }: { model: JagGraphWorkspaceModel }) {
  return (
    <>
      <label className="space-y-1">
        <span className="text-[var(--jag-muted)]">Search</span>
        <input
          name="q"
          defaultValue={model.query.q}
          placeholder="Nodes…"
          className="ml-2 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
        />
      </label>
      <label className="space-y-1">
        <span className="text-[var(--jag-muted)]">Kind</span>
        <select
          name="kind"
          defaultValue={model.query.kind}
          className="ml-2 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
        >
          <option value="all">All</option>
          {model.nodeKinds.map((k) => (
            <option key={k} value={k}>
              {nodeKindLabel(k)}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-[var(--jag-muted)]">Capability</span>
        <input
          name="capability"
          defaultValue={model.query.capabilityId}
          placeholder="id…"
          className="ml-2 w-36 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
        />
      </label>
      <label className="space-y-1">
        <span className="text-[var(--jag-muted)]">From</span>
        <input
          type="date"
          name="from"
          defaultValue={model.query.fromDate}
          className="ml-2 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
        />
      </label>
      <label className="space-y-1">
        <span className="text-[var(--jag-muted)]">To</span>
        <input
          type="date"
          name="to"
          defaultValue={model.query.toDate}
          className="ml-2 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
        />
      </label>
      <input type="hidden" name="depth" value={String(model.query.depth)} />
      {model.focusNodeId ? (
        <input type="hidden" name="focus" value={model.focusNodeId} />
      ) : null}
    </>
  );
}

function hrefFor(
  model: JagGraphWorkspaceModel,
  patch: {
    focus?: string | undefined;
    depth?: string;
  }
): string {
  const params = new URLSearchParams();
  if (model.organizationId) params.set("org", model.organizationId);
  if (model.query.q) params.set("q", model.query.q);
  if (model.query.kind !== "all") params.set("kind", model.query.kind);
  if (model.query.capabilityId) params.set("capability", model.query.capabilityId);
  if (model.query.fromDate) params.set("from", model.query.fromDate);
  if (model.query.toDate) params.set("to", model.query.toDate);
  params.set("depth", patch.depth ?? String(model.query.depth));
  const focus =
    patch.focus === undefined && !("focus" in patch)
      ? model.focusNodeId
      : patch.focus;
  if (focus) params.set("focus", focus);
  const qs = params.toString();
  return qs ? `/jag/graph?${qs}` : "/jag/graph";
}
