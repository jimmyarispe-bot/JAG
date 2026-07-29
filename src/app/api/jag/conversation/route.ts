/**
 * Streaming endpoint for Executive Conversation — progressive grounded chunks.
 * Application layer only. No LLM. No fabricated facts.
 */

import { NextResponse } from "next/server";
import {
  askExecutiveConversation,
  chunkAnswerForStream,
} from "@/lib/jag-command-center/conversation";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    question?: string;
    conversationId?: string | null;
    organizationId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "Question required" }, { status: 400 });
  }

  const result = askExecutiveConversation({
    session,
    question,
    conversationId: body.conversationId,
    organizationId: body.organizationId,
  });

  const chunks = chunkAnswerForStream(result.answer);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `${JSON.stringify({
            type: "meta",
            conversationId: result.conversation.id,
            intent: result.intent,
            durationMs: result.durationMs,
            observationId: result.observationId,
            answer: result.answer,
          })}\n`
        )
      );
      let i = 0;
      const tick = () => {
        if (i >= chunks.length) {
          controller.enqueue(
            encoder.encode(`${JSON.stringify({ type: "done" })}\n`)
          );
          controller.close();
          return;
        }
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({ type: "chunk", text: chunks[i] })}\n`
          )
        );
        i += 1;
        setTimeout(tick, 40);
      };
      tick();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
