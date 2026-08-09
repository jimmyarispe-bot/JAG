import type { Metadata } from "next";
import { JagOnboardingView } from "@/components/jag/command-center/onboarding";
import { loadOnboardingWorkspace } from "@/lib/jag-command-center/onboarding";
import { requireJagPlatformAdminSession } from "@/lib/jag-platform/admin-access";
import { POWERED_BY_LINE, THE_JAG_MARK } from "@/lib/platform/branding";

export const metadata: Metadata = {
  title: "Executive Onboarding",
  description: `Create your branded workspace on ${THE_JAG_MARK}. ${POWERED_BY_LINE}`,
};

export default async function JagOnboardingPage() {
  const session = await requireJagPlatformAdminSession();

  const model = loadOnboardingWorkspace(session);
  return <JagOnboardingView model={model} />;
}
