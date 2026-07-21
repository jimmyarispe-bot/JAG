import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type PromptKind =
  | "system"
  | "domain"
  | "decision_policy"
  | "guardrail"
  | "response_template";

export interface PromptRecord {
  id: string;
  key: string;
  version: number;
  kind: PromptKind;
  domain: string | null;
  title: string;
  body: string;
  status: string;
}

/** Prompt & Policy Registry — versioned, auditable. */
export async function listPrompts(
  supabase: AuthClient,
  kind?: PromptKind
): Promise<PromptRecord[]> {
  let q = supabase
    .from("jag_prompt_registry")
    .select("*")
    .eq("status", "active")
    .order("key");
  if (kind) q = q.eq("kind", kind);
  const { data } = await q;
  return (data ?? []).map((r) => ({
    id: String(r.id),
    key: String(r.key),
    version: Number(r.version),
    kind: r.kind as PromptKind,
    domain: (r.domain as string | null) ?? null,
    title: String(r.title),
    body: String(r.body),
    status: String(r.status),
  }));
}

export async function getPrompt(
  supabase: AuthClient,
  key: string,
  version?: number
): Promise<PromptRecord | null> {
  let q = supabase.from("jag_prompt_registry").select("*").eq("key", key);
  if (version != null) q = q.eq("version", version);
  else q = q.eq("status", "active").order("version", { ascending: false }).limit(1);
  const { data } = await q.maybeSingle();
  if (!data) return null;
  return {
    id: String(data.id),
    key: String(data.key),
    version: Number(data.version),
    kind: data.kind as PromptKind,
    domain: (data.domain as string | null) ?? null,
    title: String(data.title),
    body: String(data.body),
    status: String(data.status),
  };
}

export async function createPromptVersion(
  supabase: AuthClient,
  input: {
    key: string;
    kind: PromptKind;
    title: string;
    body: string;
    domain?: string | null;
    createdBy?: string | null;
  }
): Promise<{ ok: true; id: string; version: number } | { ok: false; error: string }> {
  const { data: latest } = await supabase
    .from("jag_prompt_registry")
    .select("version")
    .eq("key", input.key)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = Number(latest?.version ?? 0) + 1;
  const { data, error } = await supabase
    .from("jag_prompt_registry")
    .insert({
      key: input.key,
      version,
      kind: input.kind,
      domain: input.domain ?? null,
      title: input.title,
      body: input.body,
      status: "active",
      created_by: input.createdBy ?? null,
    })
    .select("id, version")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Failed" };
  return { ok: true, id: data.id, version: data.version };
}
