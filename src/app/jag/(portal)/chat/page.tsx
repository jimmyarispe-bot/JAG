import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { JagLoadingSkeleton } from "@/components/jag/command-center";
import { JagChatView } from "@/components/jag/command-center/chat";
import { loadConversationWorkspace } from "@/lib/jag-command-center/conversation";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Executive Conversation · JAG",
  description:
    "Evidence-backed executive conversation — grounded in JAG intelligence, not a chatbot.",
};

export default async function JagChatPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; org?: string; q?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }

  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <JagLoadingSkeleton
          title="Executive Conversation"
          description="Loading conversation workspace…"
          cards={3}
        />
      }
    >
      <ChatContent
        conversationId={params.c}
        organizationId={params.org}
        search={params.q}
      />
    </Suspense>
  );
}

async function ChatContent({
  conversationId,
  organizationId,
  search,
}: {
  conversationId?: string;
  organizationId?: string;
  search?: string;
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

  const model = loadConversationWorkspace(session, {
    conversationId,
    organizationId,
    search,
  });

  return <JagChatView model={model} />;
}
