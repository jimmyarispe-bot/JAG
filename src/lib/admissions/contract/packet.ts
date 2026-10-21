import type { SupabaseClient } from "@supabase/supabase-js";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any, any, any>;

/**
 * THE PACKET A PARENT SIGNS, AND THE SIGNATURES ON IT.
 *
 * `enrollment_packets` needs an `admissions_applications` row, and almost no
 * family has one (6 of 347 leads on 15 October) - the application form writes
 * to the lead, not to that table. So sending a contract creates the
 * application row it needs, as the 27 September plan said: "the fix is
 * plumbing, writing the row when ... the lead is accepted".
 */

export interface BlockSignature {
  signerName: string;
  signatureText: string;
  signedAt: string;
}

export interface PacketRow {
  id: string;
  applicationId: string;
  leadId: string;
  schoolId: string;
  status: string;
  completedAt: string | null;
  /**
   * When the contract invitation went to the parent (migration 576). The
   * acceptance builds a packet too, so a packet existing is NOT "sent".
   */
  contractSentAt: string | null;
  /** The contract as signed (migration 571), for a completed packet. */
  signedBlocks: SignedBlock[] | null;
}

export interface SignedBlock {
  templateKey: string;
  title: string;
  sortOrder: number;
  html: string;
}

function readSignedBlocks(value: unknown): SignedBlock[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  return value.map((b) => {
    const r = b as Record<string, unknown>;
    return {
      templateKey: String(r.templateKey),
      title: String(r.title),
      sortOrder: Number(r.sortOrder),
      html: String(r.html),
    };
  });
}

export async function latestPacketForLead(db: AnyClient, leadId: string): Promise<PacketRow | null> {
  const { data } = await db
    .from("enrollment_packets")
    .select("id, application_id, lead_id, school_id, packet_status, completed_at, signed_contract, contract_sent_at")
    .eq("lead_id", leadId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    id: String(data.id),
    applicationId: String(data.application_id),
    leadId: String(data.lead_id),
    schoolId: String(data.school_id),
    status: String(data.packet_status ?? "sent"),
    completedAt: (data.completed_at as string | null) ?? null,
    contractSentAt: ((data as Record<string, unknown>).contract_sent_at as string | null) ?? null,
    signedBlocks: readSignedBlocks((data as Record<string, unknown>).signed_contract),
  };
}

/** The signed copy of a packet, if it has one. */
export async function signedBlocksForPacket(db: AnyClient, packetId: string): Promise<SignedBlock[] | null> {
  const { data } = await db.from("enrollment_packets").select("signed_contract").eq("id", packetId).maybeSingle();
  return readSignedBlocks((data as Record<string, unknown> | null)?.signed_contract);
}

export async function signaturesForPacket(
  db: AnyClient,
  packetId: string
): Promise<Record<string, BlockSignature>> {
  const { data } = await db
    .from("enrollment_packet_signatures")
    .select("template_key, signer_name, signature_text, signed_at")
    .eq("enrollment_packet_id", packetId)
    .order("signed_at", { ascending: true });
  const out: Record<string, BlockSignature> = {};
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const key = String(row.template_key);
    if (out[key]) continue;
    out[key] = {
      signerName: String(row.signer_name),
      signatureText: String(row.signature_text),
      signedAt: String(row.signed_at),
    };
  }
  return out;
}

/** Create, or reuse, the application row and the packet for this child. */
export async function ensurePacket(
  db: AnyClient,
  input: { leadId: string; schoolId: string; schoolYearId: string }
): Promise<{ packet: PacketRow } | { error: string }> {
  const existing = await latestPacketForLead(db, input.leadId);
  if (existing) return { packet: existing };

  const { data: app, error: appReadError } = await db
    .from("admissions_applications")
    .select("id")
    .eq("lead_id", input.leadId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (appReadError) return { error: `Could not read the application: ${appReadError.message}` };

  let applicationId = app?.id as string | undefined;
  if (!applicationId) {
    const { data: created, error: createError } = await db
      .from("admissions_applications")
      .insert({
        lead_id: input.leadId,
        school_year_id: input.schoolYearId,
        application_status: "accepted",
        application_date: new Date().toISOString().slice(0, 10),
        admissions_decision_date: new Date().toISOString().slice(0, 10),
      })
      .select("id")
      .single();
    if (createError || !created) {
      return { error: `Could not create the application record: ${createError?.message ?? "no row"}` };
    }
    applicationId = String(created.id);
  }

  const { data: packet, error: packetError } = await db
    .from("enrollment_packets")
    .insert({
      application_id: applicationId,
      lead_id: input.leadId,
      school_id: input.schoolId,
      packet_status: "sent",
    })
    .select("id, application_id, lead_id, school_id, packet_status, completed_at")
    .single();
  if (packetError || !packet) {
    return { error: `Could not create the contract packet: ${packetError?.message ?? "no row"}` };
  }
  return {
    packet: {
      id: String(packet.id),
      applicationId: String(packet.application_id),
      leadId: String(packet.lead_id),
      schoolId: String(packet.school_id),
      status: String(packet.packet_status),
      completedAt: null,
      contractSentAt: null,
      signedBlocks: null,
    },
  };
}
