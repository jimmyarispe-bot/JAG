import { getPlatformHealthSnapshot } from "@/lib/jag-platform/health";
import { jsonOk, requireJagApiAdmin } from "@/lib/jag-platform/api";
import { jagLogger } from "@/lib/jag-platform/logging";

/** GET — internal Platform Health (admin roles only). */
export async function GET() {
  const gate = await requireJagApiAdmin();
  if (!gate.ok) return gate.response;

  jagLogger.audit("platform-health", "Platform health viewed", {
    correlationId: gate.correlationId,
    metadata: { userId: gate.session.userId, role: gate.session.role },
  });

  return jsonOk(
    { health: getPlatformHealthSnapshot() },
    { correlationId: gate.correlationId }
  );
}
