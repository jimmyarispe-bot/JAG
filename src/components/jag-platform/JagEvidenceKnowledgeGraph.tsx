"use client";

import { useMemo, useState } from "react";
import {
  KNOWLEDGE_GRAPH_NODE_TYPES,
  KNOWLEDGE_GRAPH_RELATIONSHIP_TYPES,
  type KnowledgeGraphEdge,
  type KnowledgeGraphNode,
  type KnowledgeGraphNodeType,
  type KnowledgeGraphRelationshipType,
  type KnowledgeGraphSummary,
} from "@/lib/evidence-center";

type Props = {
  readonly organizationId: string;
  readonly nodes: readonly KnowledgeGraphNode[];
  readonly edges: readonly KnowledgeGraphEdge[];
  readonly summary: KnowledgeGraphSummary;
};

const TYPE_COLORS: Record<string, string> = {
  Organization: "#0f172a",
  Product: "#1d4ed8",
  Evidence: "#047857",
  "Business Unit": "#b45309",
  Department: "#7c3aed",
  Person: "#64748b",
  Project: "#64748b",
  Goal: "#64748b",
  KPI: "#64748b",
};

function layoutNodes(
  nodes: readonly KnowledgeGraphNode[],
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const cx = width / 2;
  const cy = height / 2;
  const n = Math.max(nodes.length, 1);
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const radius = Math.min(width, height) * 0.38;
    positions.set(node.id, {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  });
  return positions;
}

export function JagEvidenceKnowledgeGraph({
  organizationId,
  nodes,
  edges,
  summary,
}: Props) {
  const [nodeType, setNodeType] = useState<KnowledgeGraphNodeType | "">("");
  const [relationshipType, setRelationshipType] = useState<
    KnowledgeGraphRelationshipType | ""
  >("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let ns = [...nodes];
    let es = [...edges];
    if (nodeType) {
      ns = ns.filter((n) => n.nodeType === nodeType);
      const ids = new Set(ns.map((n) => n.id));
      es = es.filter((e) => ids.has(e.fromNodeId) || ids.has(e.toNodeId));
    }
    if (relationshipType) {
      es = es.filter((e) => e.relationshipType === relationshipType);
      const ids = new Set<string>();
      for (const e of es) {
        ids.add(e.fromNodeId);
        ids.add(e.toNodeId);
      }
      ns = ns.filter((n) => ids.has(n.id) || (nodeType && n.nodeType === nodeType && ids.has(n.id)));
      if (relationshipType) {
        ns = nodes.filter((n) => ids.has(n.id));
        if (nodeType) ns = ns.filter((n) => n.nodeType === nodeType);
      }
    }
    return { nodes: ns, edges: es };
  }, [nodes, edges, nodeType, relationshipType]);

  const width = 720;
  const height = 420;
  const positions = useMemo(
    () => layoutNodes(filtered.nodes, width, height),
    [filtered.nodes]
  );

  const selected = selectedId
    ? nodes.find((n) => n.id === selectedId) ?? null
    : null;

  void organizationId;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Nodes
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {summary.nodeCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Relationships
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {summary.edgeCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recent additions
          </p>
          <ul className="mt-2 max-h-20 space-y-1 overflow-auto text-sm text-slate-700">
            {summary.recentNodes.length === 0 ? (
              <li className="text-slate-500">No nodes yet — upload evidence.</li>
            ) : (
              summary.recentNodes.slice(0, 5).map((n) => (
                <li key={n.id} className="truncate">
                  <span className="text-slate-400">{n.nodeType}</span> · {n.label}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="text-sm text-slate-600">
          Node type
          <select
            className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1"
            value={nodeType}
            onChange={(e) =>
              setNodeType(e.target.value as KnowledgeGraphNodeType | "")
            }
          >
            <option value="">All</option>
            {KNOWLEDGE_GRAPH_NODE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Relationship
          <select
            className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1"
            value={relationshipType}
            onChange={(e) =>
              setRelationshipType(
                e.target.value as KnowledgeGraphRelationshipType | ""
              )
            }
          >
            <option value="">All</option>
            {KNOWLEDGE_GRAPH_RELATIONSHIP_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Network view
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Explicit relationships only — no inference or analytics.
        </p>
        {filtered.nodes.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            No graph nodes match the current filters.
          </p>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="mt-3 w-full max-w-full rounded-lg bg-slate-50"
            role="img"
            aria-label="Knowledge graph network"
          >
            {filtered.edges.map((edge) => {
              const from = positions.get(edge.fromNodeId);
              const to = positions.get(edge.toNodeId);
              if (!from || !to) return null;
              return (
                <g key={edge.id}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#cbd5e1"
                    strokeWidth={1.5}
                  />
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 4}
                    textAnchor="middle"
                    className="fill-slate-400"
                    style={{ fontSize: 9 }}
                  >
                    {edge.relationshipType}
                  </text>
                </g>
              );
            })}
            {filtered.nodes.map((node) => {
              const pos = positions.get(node.id);
              if (!pos) return null;
              const color = TYPE_COLORS[node.nodeType] ?? "#334155";
              const active = selectedId === node.id;
              return (
                <g
                  key={node.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedId(node.id)}
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={active ? 18 : 14}
                    fill={color}
                    opacity={0.9}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 28}
                    textAnchor="middle"
                    className="fill-slate-700"
                    style={{ fontSize: 10 }}
                  >
                    {node.label.length > 22
                      ? `${node.label.slice(0, 20)}…`
                      : node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
        {selected ? (
          <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <p className="font-medium text-slate-900">{selected.label}</p>
            <p className="text-xs text-slate-500">
              {selected.nodeType}
              {selected.externalId ? ` · ${selected.externalId}` : ""}
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Nodes by type</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {Object.entries(summary.nodesByType).map(([type, count]) => (
              <li key={type} className="flex justify-between">
                <span>{type}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">
            Relationships by type
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {Object.entries(summary.edgesByType).map(([type, count]) => (
              <li key={type} className="flex justify-between">
                <span>{type}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
