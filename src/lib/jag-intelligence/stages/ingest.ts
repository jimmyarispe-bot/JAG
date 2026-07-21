import type { createAuthClient } from "@/lib/supabase/server-auth";
import { loadEiSignals, type EiEventSignal } from "@/lib/founder-intelligence/events";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Stage 1 — Event Ingestion (read-only EI consumption). */
export async function stageEventIngestion(
  supabase: AuthClient,
  options?: {
    organizationId?: string | null;
    schoolId?: string | null;
    limit?: number;
    sinceHours?: number;
  }
): Promise<EiEventSignal[]> {
  return loadEiSignals(supabase, {
    organizationId: options?.organizationId,
    schoolId: options?.schoolId,
    limit: options?.limit ?? 250,
    sinceHours: options?.sinceHours ?? 72,
  });
}
