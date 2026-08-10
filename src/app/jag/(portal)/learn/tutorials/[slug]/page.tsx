import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { JagTutorialDetail } from "@/components/jag/command-center/learn";
import {
  canAccessJagLearningCenter,
  getAccessibleTutorial,
  getTutorialProgressForUser,
  withResolvedJagLearnTutorialVideo,
} from "@/lib/jag-command-center/learning";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Tutorial · ${slug}` };
}

export default async function JagTutorialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);
  if (!canAccessJagLearningCenter(session)) redirect("/jag");

  const { slug } = await params;
  const tutorial = await getAccessibleTutorial(
    session,
    slug,
    session.organizationId
  );
  if (!tutorial) notFound();

  const progress = await getTutorialProgressForUser(session, tutorial.id);
  const tutorialWithPlayback = await withResolvedJagLearnTutorialVideo(tutorial);
  return (
    <JagTutorialDetail
      tutorial={tutorialWithPlayback}
      initialProgress={progress}
    />
  );
}
