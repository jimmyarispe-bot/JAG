import { jsonOk, requireJagApiSession } from "@/lib/jag-platform/api";
import { getPlatformSdk } from "@/lib/platform-sdk";

export async function GET() {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const sdk = getPlatformSdk();
  return jsonOk(
    {
      connectors: sdk.registry.listConnectors().map((c) => ({
        id: c.id,
        version: c.version,
        capabilities: c.capabilities(),
        entityMappings: c.entityMappings(),
        permissions: c.permissions(),
      })),
      twinEntityTypes: sdk.registry.listTwinEntityTypes(),
      insightProviders: sdk.registry.listInsightProviders().map((p) => ({
        id: p.id,
        version: p.version,
        ruleCount: p.rules().length,
      })),
      decisionProviders: sdk.registry.listDecisionSources().map((s) => ({
        id: s.id,
        version: s.version,
        label: s.label,
      })),
      evidenceProviders: sdk.registry.listEvidenceProviders().map((p) => ({
        id: p.id,
        version: p.version,
      })),
    },
    { correlationId: gate.correlationId }
  );
}
