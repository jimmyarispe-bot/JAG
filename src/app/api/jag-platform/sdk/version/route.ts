import { jsonOk, requireJagApiSession } from "@/lib/jag-platform/api";
import { JAG_PLATFORM_VERSION } from "@/lib/jag-platform/versioning";
import { getPlatformSdk, PLATFORM_SDK_INFO } from "@/lib/platform-sdk";

export async function GET() {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const sdk = getPlatformSdk();
  return jsonOk(
    {
      sdk: PLATFORM_SDK_INFO,
      platform: JAG_PLATFORM_VERSION,
      runtimeSdkVersion: sdk.version,
    },
    { correlationId: gate.correlationId }
  );
}
