import {
  createMrJagAcademyEngine,
  installMrJag,
} from "@mr-jag";
import { jsonError, jsonOk, JagErrors, requireMrJagOrg, requireMrJagOrgBody } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireMrJagOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const { searchParams } = new URL(request.url);
  const engine = createMrJagAcademyEngine();
  const quizId = searchParams.get("quizId");
  if (quizId) {
    return jsonOk(
      { quiz: engine.explainQuiz(quizId) },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    {
      quizzes: engine.quizzes(searchParams.get("persona") ?? undefined),
      attempts: engine.dashboard({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
        persona: searchParams.get("persona"),
      }).quizResults,
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    quizId?: string;
    answers?: number[];
  };
  const gate = await requireMrJagOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createMrJagAcademyEngine();
  const attempt = engine.scoreQuiz({
    quizId: body.quizId ?? "",
    userId: gate.session.userId,
    organizationId: gate.organizationId,
    answers: body.answers ?? [],
  });
  if ("error" in attempt) {
    return jsonError(JagErrors.validation(attempt.error));
  }
  return jsonOk(
    {
      attempt,
      quiz: engine.explainQuiz(body.quizId ?? ""),
    },
    { correlationId: gate.correlationId, status: 201 }
  );
}
