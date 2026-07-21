import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { createDocument } from "@/lib/documents/service";
import type { ContractStatus } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type ContractResult =
  | { ok: true; contractId: string; documentId?: string; auditId: string }
  | { ok: false; error: string };

export async function createEmploymentContract(
  supabase: AuthClient,
  input: {
    employeeId: string;
    schoolId?: string | null;
    title?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
    createPlatformDocument?: boolean;
  }
): Promise<ContractResult> {
  const actorUserId = await resolveActorUserId(supabase);
  const { data: employee } = await supabase
    .from("employees")
    .select("id, school_id")
    .eq("id", input.employeeId)
    .maybeSingle();
  if (!employee) return { ok: false, error: "Employee not found" };

  const schoolId = input.schoolId ?? employee.school_id;
  const schoolCtx = schoolId ? await resolveSchoolContext(supabase, schoolId) : null;
  let documentId: string | null = null;

  if (input.createPlatformDocument !== false) {
    const doc = await createDocument(supabase, {
      title: input.title ?? "Employment Contract",
      description: input.notes ?? "Employment contract",
      category: "contracts",
      documentType: "employment_contract",
      schoolId,
      organizationId: schoolCtx?.organizationId,
      status: "draft",
      tags: ["hr", "contract", "employee"],
      relations: [
        { entityType: "employee", entityId: input.employeeId, isPrimary: true },
        ...(schoolId
          ? [{ entityType: "school" as const, entityId: schoolId, isPrimary: false }]
          : []),
      ],
      metadata: { employeeId: input.employeeId },
    });
    if (doc.ok) documentId = doc.documentId;
  }

  const { data, error } = await supabase
    .from("hr_employment_contracts")
    .insert({
      employee_id: input.employeeId,
      school_id: schoolId,
      title: input.title ?? "Employment Contract",
      status: "draft",
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      document_id: documentId,
      notes: input.notes ?? null,
      created_by: actorUserId,
    })
    .select("id, audit_id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Contract create failed" };
  return {
    ok: true,
    contractId: data.id,
    documentId: documentId ?? undefined,
    auditId: data.audit_id,
  };
}

export async function updateContractStatus(
  supabase: AuthClient,
  contractId: string,
  status: ContractStatus
): Promise<ContractResult> {
  const { data, error } = await supabase
    .from("hr_employment_contracts")
    .update({
      status,
      archived_at: status === "archived" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId)
    .select("id, audit_id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Update failed" };
  return { ok: true, contractId: data.id, auditId: data.audit_id };
}

export async function renewContract(
  supabase: AuthClient,
  contractId: string,
  input?: { endDate?: string; title?: string }
): Promise<ContractResult> {
  const { data: prior } = await supabase
    .from("hr_employment_contracts")
    .select("*")
    .eq("id", contractId)
    .maybeSingle();
  if (!prior) return { ok: false, error: "Contract not found" };

  await updateContractStatus(supabase, contractId, "renewed");

  const created = await createEmploymentContract(supabase, {
    employeeId: prior.employee_id,
    schoolId: prior.school_id,
    title: input?.title ?? `${prior.title} (Renewed)`,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: input?.endDate,
    notes: `Renewed from ${contractId}`,
  });

  if (created.ok) {
    await supabase
      .from("hr_employment_contracts")
      .update({ renewal_of_id: contractId, status: "active" })
      .eq("id", created.contractId);
  }
  return created;
}

export async function listEmployeeContracts(
  supabase: AuthClient,
  employeeId: string
) {
  const { data } = await supabase
    .from("hr_employment_contracts")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
