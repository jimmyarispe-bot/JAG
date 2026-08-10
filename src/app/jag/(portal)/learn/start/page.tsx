import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JagStartHere } from "@/components/jag/command-center/learn";
import { canAccessJagLearningCenter } from "@/lib/jag-command-center/learning";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Start Here",
  description: "First-time orientation to The JAG™ Command Center.",
};

export default async function JagLearnStartPage() {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);
  if (!canAccessJagLearningCenter(session)) redirect("/jag");
  return <JagStartHere />;
}
