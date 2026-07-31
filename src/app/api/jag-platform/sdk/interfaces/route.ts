import { jsonOk, requireJagApiSession } from "@/lib/jag-platform/api";
import { getPlatformSdk } from "@/lib/platform-sdk";

export async function GET() {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const sdk = getPlatformSdk();
  return jsonOk(
    { interfaces: sdk.listInterfaces() },
    { correlationId: gate.correlationId }
  );
}
