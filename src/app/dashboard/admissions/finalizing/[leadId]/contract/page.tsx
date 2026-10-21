/**
 * ONE CHILD'S CONTRACT, AS THE FAMILY WILL SEE IT - JIMMY'S PREVIEW.
 *
 * The contract with this family's own figures, every part, and who has
 * initialled what. Print / Save as PDF from here gives the school's copy.
 * Send contract shows the invitation letter first and asks to confirm.
 *
 * Only Jimmy, like the rest of Finalizing Contract.
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ContractDocument } from "@/components/admissions/contract/ContractDocument";
import { PrintButton } from "@/components/admissions/contract/PrintButton";
import { SendContractPanel } from "@/components/admissions/finalizing/SendContractPanel";
import { loadLeadContract } from "@/lib/admissions/contract/for-lead";
import { latestPacketForLead, signaturesForPacket } from "@/lib/admissions/contract/packet";
import { buildContractInviteBody, buildTuitionSummaryHtml } from "@/lib/admissions/portal/prospect-invite-email";
import { canViewFounderDashboard } from "@/lib/dashboard/founder-dashboard-access";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contract · Finalizing Contract · The JAG™" };

export default async function FinalizingContractPreviewPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login");
  if (!canViewFounderDashboard(ctx)) notFound();

  const { leadId } = await params;
  const supabase = await createAuthClient();
  const loaded = await loadLeadContract(supabase, leadId);

  const back = (
    <Link href="/dashboard/admissions/finalizing" className="text-sm text-slate-500 hover:text-slate-700 print:hidden">
      ‹ Finalizing Contract
    </Link>
  );

  if ("error" in loaded) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {back}
        <h1 className="text-2xl font-semibold text-slate-900">Contract</h1>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The contract cannot be shown yet: {loaded.error}
        </div>
      </div>
    );
  }

  const packet = await latestPacketForLead(supabase, leadId);
  /* Signed: show the copy the parent signed (migration 571), not today's figures. */
  const contract =
    packet?.status === "completed" && packet.signedBlocks
      ? { ...loaded.contract, blocks: packet.signedBlocks }
      : loaded.contract;
  const signatures = packet ? await signaturesForPacket(supabase, packet.id) : {};
  const letter = buildContractInviteBody({
    parentName: contract.guardianName.split(" ")[0] ?? "",
    childName: contract.studentName.split(" ")[0] ?? contract.studentName,
    schoolName: contract.schoolName,
    inviteLink: "#",
    tuitionSummaryHtml: buildTuitionSummaryHtml(contract.fields),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {back}
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{contract.studentName}</h1>
          <p className="text-sm text-slate-500">
            {contract.schoolName} · {contract.guardianName || "Parent not named"} · contract{" "}
            {packet ? packet.status.replace(/_/g, " ") : "not sent"}
          </p>
        </div>
        <PrintButton />
      </div>

      {!packet || packet.status === "sent" ? (
        <SendContractPanel leadId={leadId} letterHtml={letter} alreadySent={Boolean(packet)} />
      ) : null}

      <ContractDocument contract={contract} signatures={signatures} />
    </div>
  );
}
