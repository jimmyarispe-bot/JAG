import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JagLearningHelp } from "@/components/jag/command-center/learn";
import { canAccessJagLearningCenter } from "@/lib/jag-command-center/learning";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Help",
  description: "JAG product help and tutorial search.",
};

export default async function JagLearnHelpPage() {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);
  if (!canAccessJagLearningCenter(session)) redirect("/jag");
  return <JagLearningHelp />;
}
