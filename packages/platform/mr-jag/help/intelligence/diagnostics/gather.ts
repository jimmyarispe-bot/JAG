/**
 * Automatic evidence gathering for intelligent help.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { searchMrJagKnowledge } from "../../../knowledge";
import { normalizePersona } from "../../../personas";
import { listPageLearningMetadata } from "../../../tutorials/registry";
import type { HelpEvidence, MrJagPersona } from "../../../types";
import type { DiagnosticBundle, DiagnosticSignal } from "../types";

function detectIntent(question: string): string {
  const q = question.toLowerCase();
  if (/(invite|add).*(teacher|staff|employee)/.test(q)) return "invite_teacher";
  if (/payroll/.test(q)) return "payroll_issue";
  if (/invoice/.test(q) && /(disappear|missing|gone|can't find|cannot find)/.test(q))
    return "invoices_missing";
  if (/google|workspace|sync/.test(q)) return "google_workspace_sync";
  if (/permission|access denied|unauthorized|forbidden/.test(q))
    return "permissions";
  return "general";
}

export function gatherDiagnostics(input: {
  question: string;
  persona?: string | null;
  root?: string;
  organizationId?: string;
  role?: string | null;
  includeGraph?: boolean;
}): DiagnosticBundle & { intent: string } {
  const root = input.root ?? process.cwd();
  const persona: MrJagPersona = normalizePersona(input.persona);
  const intent = detectIntent(input.question);
  const env = process.env;
  const signals: DiagnosticSignal[] = [];

  const hits = searchMrJagKnowledge({
    query: `${input.question} ${intent.replace(/_/g, " ")}`,
    root,
    includeGraph: input.includeGraph === true,
    limit: 12,
  });

  const searchHits: HelpEvidence[] = hits.map((h) => ({
    source: h.kind,
    id: h.id,
    title: h.title,
    excerpt: h.excerpt,
    path: h.path,
  }));

  signals.push({
    id: "diag.docs",
    category: "documentation",
    ok: searchHits.some((h) => h.source === "documentation" || h.source === "tutorial"),
    detail: `${searchHits.filter((h) => h.source === "documentation" || h.source === "tutorial").length} documentation/tutorial hit(s)`,
    evidence: Object.freeze(
      searchHits
        .filter((h) => h.source === "documentation" || h.source === "tutorial")
        .slice(0, 4)
        .map((h) => h.path ?? h.id)
    ),
    weight: 2,
  });

  signals.push({
    id: "diag.release",
    category: "release",
    ok: searchHits.some((h) => h.source === "release" || h.source === "per"),
    detail: "Release notes / PER evidence scanned",
    evidence: Object.freeze(
      searchHits
        .filter((h) => h.source === "release" || h.source === "per")
        .slice(0, 3)
        .map((h) => h.id)
    ),
    weight: 2,
  });

  signals.push({
    id: "diag.kg",
    category: "knowledge_graph",
    ok:
      input.includeGraph === true
        ? searchHits.some((h) => h.source === "knowledge_graph")
        : true,
    detail:
      input.includeGraph === true
        ? "Knowledge Graph queried"
        : "Knowledge Graph deferred (pass includeGraph)",
    evidence: Object.freeze(
      searchHits
        .filter((h) => h.source === "knowledge_graph")
        .slice(0, 3)
        .map((h) => h.id)
    ),
    weight: input.includeGraph ? 3 : 1,
  });

  const supabaseOk = Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const emailOk = Boolean(env.RESEND_API_KEY?.trim()) || env.NODE_ENV !== "production";
  signals.push({
    id: "diag.config.supabase",
    category: "configuration",
    ok: supabaseOk || env.NODE_ENV !== "production",
    detail: supabaseOk
      ? "Supabase URL present"
      : "Supabase URL missing (may block auth/invites in production)",
    evidence: Object.freeze(["NEXT_PUBLIC_SUPABASE_URL"]),
    weight: 4,
  });
  signals.push({
    id: "diag.config.email",
    category: "configuration",
    ok: emailOk,
    detail: emailOk
      ? "Email provider configuration acceptable for environment"
      : "RESEND_API_KEY missing — invites/notifications may fail",
    evidence: Object.freeze(["RESEND_API_KEY"]),
    weight: intent === "invite_teacher" ? 5 : 3,
  });

  const opsDocs = existsSync(join(root, "docs/academyos/rc3/07_DIAGNOSTICS.md"));
  signals.push({
    id: "diag.ops",
    category: "operations",
    ok: opsDocs,
    detail: opsDocs
      ? "AcademyOS RC-3 diagnostics documentation present"
      : "Operations diagnostics docs missing",
    evidence: Object.freeze(["docs/academyos/rc3/07_DIAGNOSTICS.md"]),
    weight: 2,
  });

  const connectorDocs =
    existsSync(join(root, "docs/connectors")) ||
    existsSync(join(root, "packages/academyos/connectors/catalog.ts"));
  signals.push({
    id: "diag.connectors",
    category: "connector",
    ok: connectorDocs,
    detail: connectorDocs
      ? "Connector catalog / docs available"
      : "Connector evidence weak",
    evidence: Object.freeze(["packages/academyos/connectors/catalog.ts"]),
    weight: intent === "google_workspace_sync" ? 5 : 2,
  });

  signals.push({
    id: "diag.permissions",
    category: "permissions",
    ok: existsSync(join(root, "docs/academyos/rc2/01_SECURITY.md")),
    detail: "Permission / security baseline documentation",
    evidence: Object.freeze(["docs/academyos/rc2/01_SECURITY.md"]),
    weight: intent === "permissions" || intent === "invite_teacher" ? 4 : 2,
  });

  signals.push({
    id: "diag.role",
    category: "role",
    ok: true,
    detail: `Acting persona ${persona}${input.role ? ` (role hint: ${input.role})` : ""}`,
    evidence: Object.freeze([persona, input.role ?? "n/a"]),
    weight: 1,
  });

  signals.push({
    id: "diag.org",
    category: "organization",
    ok: Boolean(input.organizationId),
    detail: input.organizationId
      ? `Organization context ${input.organizationId}`
      : "No organization id provided",
    evidence: Object.freeze([input.organizationId ?? "missing"]),
    weight: 1,
  });

  const tutorials = listPageLearningMetadata({ persona });
  signals.push({
    id: "diag.tutorials",
    category: "documentation",
    ok: tutorials.length > 0,
    detail: `${tutorials.length} registered tutorial(s) for persona`,
    evidence: Object.freeze(tutorials.slice(0, 4).map((t) => t.pageId)),
    weight: 2,
  });

  return {
    generatedAt: new Date().toISOString(),
    question: input.question,
    persona,
    signals: Object.freeze(signals),
    searchHits: Object.freeze(searchHits),
    intent,
  };
}
