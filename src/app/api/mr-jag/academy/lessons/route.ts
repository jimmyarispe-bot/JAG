import {
  createMrJagAcademyEngine,
  installMrJag,
} from "@mr-jag";
import { jsonOk, requireMrJagOrg, requireMrJagOrgBody } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireMrJagOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const { searchParams } = new URL(request.url);
  const engine = createMrJagAcademyEngine();
  const lessonId = searchParams.get("lessonId");
  const pageId = searchParams.get("pageId");
  const includeScript = searchParams.get("script") === "1";
  if (lessonId) {
    const lesson = engine.getLesson(lessonId);
    return jsonOk(
      {
        lesson,
        script: includeScript && lesson ? engine.scriptForLesson(lessonId) : null,
      },
      { correlationId: gate.correlationId }
    );
  }
  if (pageId) {
    const lesson = engine.lessonForPage(pageId);
    return jsonOk(
      {
        lesson,
        script:
          includeScript && lesson
            ? engine.scriptForLesson(lesson.lessonId)
            : null,
      },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    { lessons: engine.listLessons(searchParams.get("persona")) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    lessonId?: string;
    persona?: string;
    secondsSpent?: number;
    action?: "complete";
  };
  const gate = await requireMrJagOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createMrJagAcademyEngine();
  const progress = engine.completeLesson({
    organizationId: gate.organizationId,
    userId: gate.session.userId,
    lessonId: body.lessonId ?? "",
    persona: body.persona,
    secondsSpent: body.secondsSpent,
  });
  return jsonOk(
    { progress },
    { correlationId: gate.correlationId, status: 201 }
  );
}
