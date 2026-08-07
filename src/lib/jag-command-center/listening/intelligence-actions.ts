"use server";

import { revalidatePath } from "next/cache";
import { runListeningAnalysis } from "@/lib/platform/listening/intelligence/service";
import { requireListeningAnalyze } from "./access";

export type ListeningIntelligenceActionResult =
  | {
      readonly ok: true;
      readonly analysisRunId: string;
      readonly signalCount: number;
      readonly evidenceCount: number;
    }
  | { readonly ok: false; readonly error: string };

export async function runListeningAnalysisAction(
  formData: FormData
): Promise<ListeningIntelligenceActionResult> {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  if (!organizationId || !campaignId) {
    return { ok: false, error: "Organization and campaign are required." };
  }

  const access = await requireListeningAnalyze(organizationId);
  if (!access.ok) return access;

  try {
    const result = await runListeningAnalysis(access.supabase, {
      organizationId,
      campaignId,
      createdBy: access.session.userId,
    });
    if (result.status === "failed") {
      return {
        ok: false,
        error: result.errorSummary ?? "Analysis failed.",
      };
    }
    revalidatePath("/jag/listening/intelligence");
    return {
      ok: true,
      analysisRunId: result.analysisRunId,
      signalCount: result.signalCount,
      evidenceCount: result.evidenceCount,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Analysis failed.",
    };
  }
}
