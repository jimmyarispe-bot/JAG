/**
 * /contract - WHERE A PARENT READS, INITIALS, SIGNS AND PRINTS THEIR CHILD'S
 * ENROLLMENT AND TUITION CONTRACT.
 *
 * The only page a parent account can open (lib/admissions/contract/
 * parent-only.ts). Jimmy, 18 October 2026: "parents should only get access to
 * this related information when/if they receive a login to the jag".
 *
 * WHICH CONTRACTS: the packets the parent's OWN session can read. Row-level
 * security on enrollment_packets shows a guardian only their own child's
 * (is_guardian_of_lead). Only after that does the server load the contract
 * text and figures with the service role, because a parent may not read the
 * tuition tables directly - and it loads nothing for a packet the parent
 * could not see.
 */
import { redirect } from "next/navigation";

import { ContractDocument } from "@/components/admissions/contract/ContractDocument";
import { PrintButton } from "@/components/admissions/contract/PrintButton";
import { SignPartForm } from "@/components/admissions/contract/SignPartForm";
import { getSessionUser } from "@/lib/auth/session";
import { loadLeadContract, type LeadContract } from "@/lib/admissions/contract/for-lead";
import {
  signaturesForPacket,
  signedBlocksForPacket,
  type BlockSignature,
} from "@/lib/admissions/contract/packet";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Enrollment and Tuition Contract · The Academy" };

interface Loaded {
  packetId: string;
  status: string;
  contract: LeadContract | null;
  error: string | null;
  signatures: Record<string, BlockSignature>;
}

export default async function ParentContractPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/contract");

  const parent = await createAuthClient();
  const { data: packets, error } = await parent
    .from("enrollment_packets")
    .select("id, lead_id, packet_status, generated_at, signed_contract")
    .order("generated_at", { ascending: false });

  const admin = createServiceRoleClient();
  const loaded: Loaded[] = [];
  const seenLeads = new Set<string>();
  for (const p of (packets ?? []) as Record<string, unknown>[]) {
    const leadId = String(p.lead_id);
    if (seenLeads.has(leadId)) continue;
    seenLeads.add(leadId);
    const result = await loadLeadContract(admin, leadId);
    const status = String(p.packet_status ?? "sent");
    /* A signed contract is shown exactly as signed (migration 571), never
       re-rendered with figures edited since. */
    const signed = status === "completed" ? await signedBlocksForPacket(parent, String(p.id)) : null;
    const contract = "error" in result ? null : result.contract;
    loaded.push({
      packetId: String(p.id),
      status,
      contract: contract && signed ? { ...contract, blocks: signed } : contract,
      error: "error" in result ? result.error : null,
      signatures: await signaturesForPacket(parent, String(p.id)),
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Enrollment and Tuition Contract</h1>
            <p className="text-sm text-slate-500">Signed in as {session.email}</p>
          </div>
          {loaded.length > 0 ? <PrintButton /> : null}
        </header>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            We could not load your contract. Please try again, or reply to the email you received.
          </p>
        ) : null}

        {!error && loaded.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-600">
            There is nothing to sign yet. You will receive an email when your child&rsquo;s contract is ready.
          </p>
        ) : null}

        {loaded.map((item) =>
          item.contract ? (
            <div key={item.packetId} className="space-y-3">
              {item.status === "completed" ? (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 print:hidden">
                  {item.contract.fields.remaining_due <= 0
                    ? "Signed — thank you. Your scholarship covers your tuition, so there is nothing for you to pay. You can print or save this contract as a PDF at any time."
                    : "Signed — thank you. You will receive an invoice for your first tuition payment. You can print or save this contract as a PDF at any time."}
                </p>
              ) : (
                <p className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700 print:hidden">
                  Read each part, type your initials under it, then sign the last part with your full name.
                </p>
              )}
              <ContractDocument
                contract={item.contract}
                signatures={item.signatures}
                renderBlockFooter={
                  item.status === "completed"
                    ? undefined
                    : (templateKey) => (
                        <SignPartForm
                          packetId={item.packetId}
                          templateKey={templateKey}
                          isSignature={templateKey === "contract_acknowledgement"}
                          defaultName={session.fullName}
                        />
                      )
                }
              />
            </div>
          ) : (
            <p
              key={item.packetId}
              className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              Your contract is being finalized. Please check back soon.
            </p>
          )
        )}
      </div>
    </main>
  );
}
