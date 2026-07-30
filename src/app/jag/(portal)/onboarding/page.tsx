import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JagOnboardingView } from "@/components/jag/command-center/onboarding";
import { loadOnboardingWorkspace } from "@/lib/jag-command-center/onboarding";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { POWERED_BY_LINE } from "@/lib/platform/branding";

export const metadata: Metadata = {
  title: "Executive Onboarding",
  description: `Create your branded Executive Intelligence Platform. ${POWERED_BY_LINE}`,
};

export default async function JagOnboardingPage() {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

  const model = loadOnboardingWorkspace(session);
  return <JagOnboardingView model={model} />;
}
