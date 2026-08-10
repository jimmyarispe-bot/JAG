import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JagTutorialLibrary } from "@/components/jag/command-center/learn";
import {
  canAccessJagLearningCenter,
  listAccessibleTutorials,
} from "@/lib/jag-command-center/learning";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Tutorials",
  description: "JAG-native tutorial library.",
};

export default async function JagTutorialsPage() {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);
  if (!canAccessJagLearningCenter(session)) redirect("/jag");

  const tutorials = await listAccessibleTutorials(
    session,
    session.organizationId
  );
  return <JagTutorialLibrary tutorials={tutorials} />;
}
