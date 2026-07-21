"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  runWorkflowManualAction,
  saveWorkflowDefinitionAction,
} from "@/lib/workflows/server-actions";
import { WORKFLOW_ACTION_LIBRARY } from "@/lib/workflows/actions";
import { WORKFLOW_TRIGGER_LIBRARY } from "@/lib/workflows/triggers";
import { createEdge, createNode } from "@/lib/workflows/definition";
import type {
  WorkflowCategory,
  WorkflowDefinitionJson,
  WorkflowNode,
  WorkflowNodeType,
  WorkflowRow,
} from "@/lib/workflows/types";

interface WorkflowBuilderProps {
  workflow: WorkflowRow;
  canEdit: boolean;
}

const NODE_COLORS: Record<WorkflowNodeType, string> = {
  trigger: "border-sky-300 bg-sky-50",
  condition: "border-amber-300 bg-amber-50",
  action: "border-emerald-300 bg-emerald-50",
  delay: "border-violet-300 bg-violet-50",
  branch: "border-orange-300 bg-orange-50",
  end: "border-slate-300 bg-slate-50",
};

export function WorkflowBuilder({ workflow, canEdit }: WorkflowBuilderProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description);
  const [triggerKey, setTriggerKey] = useState(workflow.trigger_key);
  const [category, setCategory] = useState<WorkflowCategory>(workflow.category);
  const [definition, setDefinition] = useState<WorkflowDefinitionJson>(workflow.definition);
  const [selectedId, setSelectedId] = useState<string | null>(workflow.definition.entryNodeId);
  const [message, setMessage] = useState<string | null>(null);
  const [conditionJson, setConditionJson] = useState(
    JSON.stringify(workflow.definition.conditionGroups ?? [], null, 2)
  );

  const selected = useMemo(
    () => definition.nodes.find((n) => n.id === selectedId) ?? null,
    [definition.nodes, selectedId]
  );

  function updateNode(id: string, patch: Partial<WorkflowNode>) {
    setDefinition((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, ...patch, config: { ...n.config, ...patch.config } } : n)),
    }));
  }

  function addNode(type: WorkflowNodeType) {
    const end = definition.nodes.find((n) => n.type === "end");
    const label =
      type === "action"
        ? "New action"
        : type === "condition"
          ? "Condition"
          : type === "delay"
            ? "Wait"
            : type === "branch"
              ? "Branch"
              : type;
    const config =
      type === "action"
        ? { actionType: "send_email", subject: "Notification", body: "" }
        : type === "condition"
          ? { field: "student_status", operator: "equals", value: "active" }
          : type === "delay"
            ? { seconds: 60 }
            : type === "branch"
              ? { field: "balance", operator: "gt", value: 0 }
              : {};

    const node = createNode(type, label, config);
    node.position = { x: 240 + definition.nodes.length * 20, y: 100 + definition.nodes.length * 10 };

    setDefinition((prev) => {
      const withoutEndEdge = prev.edges.filter((e) => e.to !== end?.id);
      const lastAction = [...prev.nodes].reverse().find((n) => n.type !== "end");
      const fromId = lastAction?.id ?? prev.entryNodeId;
      const edges = [
        ...withoutEndEdge.filter((e) => !(e.from === fromId && e.to === end?.id)),
        createEdge(fromId, node.id),
        ...(end ? [createEdge(node.id, end.id)] : []),
      ];
      return {
        ...prev,
        nodes: end
          ? [...prev.nodes.filter((n) => n.id !== end.id), node, end]
          : [...prev.nodes, node],
        edges,
      };
    });
    setSelectedId(node.id);
  }

  function removeNode(id: string) {
    const node = definition.nodes.find((n) => n.id === id);
    if (!node || node.type === "trigger" || node.type === "end") return;
    setDefinition((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== id),
      edges: prev.edges.filter((e) => e.from !== id && e.to !== id),
    }));
    setSelectedId(definition.entryNodeId);
  }

  function save() {
    setMessage(null);
    let conditionGroups = definition.conditionGroups;
    try {
      conditionGroups = JSON.parse(conditionJson);
    } catch {
      setMessage("Condition groups JSON is invalid.");
      return;
    }
    const next = { ...definition, conditionGroups };
    startTransition(async () => {
      const result = await saveWorkflowDefinitionAction(workflow.id, next, {
        name,
        description,
        triggerKey,
        category,
      });
      if ("error" in result && result.error) setMessage(result.error);
      else {
        setMessage("Workflow saved.");
        setDefinition(next);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Name</span>
          <input
            value={name}
            disabled={!canEdit}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Category</span>
          <select
            value={category}
            disabled={!canEdit}
            onChange={(e) => setCategory(e.target.value as WorkflowCategory)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {["admissions","students","families","communications","scholarships","billing","attendance","hr","system","general"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-slate-600">Description</span>
          <textarea
            value={description}
            disabled={!canEdit}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-slate-600">Trigger</span>
          <select
            value={triggerKey}
            disabled={!canEdit}
            onChange={(e) => {
              setTriggerKey(e.target.value);
              setDefinition((prev) => ({
                ...prev,
                nodes: prev.nodes.map((n) =>
                  n.type === "trigger"
                    ? { ...n, config: { ...n.config, triggerKey: e.target.value }, label: "Trigger" }
                    : n
                ),
              }));
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {WORKFLOW_TRIGGER_LIBRARY.map((t) => (
              <option key={t.key} value={t.key}>
                {t.category} — {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Visual canvas</h3>
            {canEdit && (
              <div className="flex flex-wrap gap-1">
                {(["condition", "action", "delay", "branch"] as WorkflowNodeType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addNode(t)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs capitalize hover:bg-slate-50"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative min-h-[320px] overflow-auto rounded-lg bg-slate-50 p-4">
            <div className="flex flex-wrap items-start gap-3">
              {definition.nodes.map((node, index) => (
                <div key={node.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedId(node.id)}
                    className={`min-w-[140px] rounded-xl border-2 px-3 py-2 text-left text-sm shadow-sm ${
                      NODE_COLORS[node.type]
                    } ${selectedId === node.id ? "ring-2 ring-brand-500" : ""}`}
                  >
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">{node.type}</p>
                    <p className="font-medium text-slate-900">{node.label}</p>
                    {node.type === "action" && (
                      <p className="text-xs text-slate-500">{String(node.config.actionType ?? "")}</p>
                    )}
                  </button>
                  {index < definition.nodes.length - 1 && (
                    <span className="text-slate-300" aria-hidden>
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Edges: {definition.edges.length} · Version {workflow.version} · Audit {workflow.audit_id}
            </p>
          </div>
        </div>

        <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold">Node inspector</h3>
          {!selected ? (
            <p className="text-sm text-slate-500">Select a node</p>
          ) : (
            <div className="space-y-2 text-sm">
              <label className="block">
                <span className="text-xs text-slate-500">Label</span>
                <input
                  value={selected.label}
                  disabled={!canEdit}
                  onChange={(e) => updateNode(selected.id, { label: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
                />
              </label>
              {selected.type === "action" && (
                <>
                  <label className="block">
                    <span className="text-xs text-slate-500">Action</span>
                    <select
                      value={String(selected.config.actionType ?? "send_email")}
                      disabled={!canEdit}
                      onChange={(e) =>
                        updateNode(selected.id, {
                          config: { ...selected.config, actionType: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
                    >
                      {WORKFLOW_ACTION_LIBRARY.map((a) => (
                        <option key={a.type} value={a.type}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-500">Subject / Title</span>
                    <input
                      value={String(selected.config.subject ?? selected.config.title ?? "")}
                      disabled={!canEdit}
                      onChange={(e) =>
                        updateNode(selected.id, {
                          config: { ...selected.config, subject: e.target.value, title: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-500">Body</span>
                    <textarea
                      value={String(selected.config.body ?? selected.config.bodyText ?? "")}
                      disabled={!canEdit}
                      onChange={(e) =>
                        updateNode(selected.id, {
                          config: { ...selected.config, body: e.target.value },
                        })
                      }
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
                    />
                  </label>
                </>
              )}
              {(selected.type === "condition" || selected.type === "branch") && (
                <>
                  <label className="block">
                    <span className="text-xs text-slate-500">Field</span>
                    <input
                      value={String(selected.config.field ?? "")}
                      disabled={!canEdit}
                      onChange={(e) =>
                        updateNode(selected.id, {
                          config: { ...selected.config, field: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-500">Operator</span>
                    <select
                      value={String(selected.config.operator ?? "equals")}
                      disabled={!canEdit}
                      onChange={(e) =>
                        updateNode(selected.id, {
                          config: { ...selected.config, operator: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
                    >
                      {["equals","not_equals","contains","exists","gt","gte","lt","lte","in"].map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-500">Value</span>
                    <input
                      value={String(selected.config.value ?? "")}
                      disabled={!canEdit}
                      onChange={(e) =>
                        updateNode(selected.id, {
                          config: { ...selected.config, value: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
                    />
                  </label>
                </>
              )}
              {canEdit && selected.type !== "trigger" && selected.type !== "end" && (
                <button
                  type="button"
                  onClick={() => removeNode(selected.id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove node
                </button>
              )}
            </div>
          )}

          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-medium text-slate-600">Condition groups (AND/OR JSON)</p>
            <textarea
              value={conditionJson}
              disabled={!canEdit}
              onChange={(e) => setConditionJson(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 font-mono text-xs"
            />
          </div>
        </aside>
      </div>

      {message && <p className="text-sm text-slate-600">{message}</p>}

      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Save workflow
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await runWorkflowManualAction(workflow.id);
                if ("error" in result && result.error) setMessage(result.error);
                else setMessage(`Manual run dispatched (${result.matched} match(es)).`);
              });
            }}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Run manually
          </button>
        </div>
      )}
    </div>
  );
}
