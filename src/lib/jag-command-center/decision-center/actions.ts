"use server";

/**
 * Server actions for Decision Center status updates.
 * Application layer only — does not invent proposals.
 */

import { revalidatePath } from "next/cache";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { setDecisionStatus } from "./status-store";
import {
  JAG_DECISION_STATUSES,
  type JagDecisionStatus,
} from "./types";

export type UpdateDecisionStatusResult =
  | { ok: true; status: JagDecisionStatus }
  | { ok: false; error: string };

export async function updateDecisionCenterStatus(input: {
  decisionId: string;
  status: string;
  message?: string;
}): Promise<UpdateDecisionStatusResult> {
  const session = await getJagPlatformSession();
  if (!session) {
    return { ok: false, error: "Not authenticated." };
  }
  if (
    !JAG_DECISION_STATUSES.includes(input.status as JagDecisionStatus)
  ) {
    return { ok: false, error: "Invalid status." };
  }
  if (!input.decisionId.trim()) {
    return { ok: false, error: "Decision id is required." };
  }

  const status = setDecisionStatus({
    decisionId: input.decisionId,
    status: input.status as JagDecisionStatus,
    actor: session.displayName || session.email,
    message: input.message,
  });

  revalidatePath("/jag/decisions");
  revalidatePath(`/jag/decisions/${input.decisionId}`);
  revalidatePath("/jag");

  return { ok: true, status };
}
