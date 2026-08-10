import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JagLearningCoach } from "@/components/jag/command-center/learn";
import { canAccessJagLearningCenter } from "@/lib/jag-command-center/learning";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "JAG Coach",
  description: "Product guidance for The JAG™ — not Executive Conversation.",
};

export default async function JagLearnCoachPage() {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);
  if (!canAccessJagLearningCenter(session)) redirect("/jag");
  return <JagLearningCoach />;
}
