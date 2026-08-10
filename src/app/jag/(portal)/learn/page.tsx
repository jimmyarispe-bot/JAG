import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JagLearningHome } from "@/components/jag/command-center/learn";
import { canAccessJagLearningCenter } from "@/lib/jag-command-center/learning";
import { loadLearningHome } from "@/lib/jag-command-center/learning/service";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Learn",
  description: "JAG Learning Center — orientation, tutorials, and Coach.",
};

export default async function JagLearnPage() {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);
  if (!canAccessJagLearningCenter(session)) redirect("/jag");

  const model = await loadLearningHome(session, session.organizationId);
  return <JagLearningHome model={model} />;
}
