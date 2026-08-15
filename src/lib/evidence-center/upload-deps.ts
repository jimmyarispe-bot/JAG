/**
 * Server-only deps for JAG Evidence durable upload (service role).
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import type { DurableEvidenceClient } from "@/lib/evidence-center/durable-repository";
import type { JagEvidenceSignedUrlClient } from "@/lib/evidence-center/storage";

export function createJagEvidenceUploadDeps(): {
  db: DurableEvidenceClient;
  storage: JagEvidenceSignedUrlClient;
} {
  const client = createServiceRoleClient();
  return {
    db: client as unknown as DurableEvidenceClient,
    storage: client as unknown as JagEvidenceSignedUrlClient,
  };
}
