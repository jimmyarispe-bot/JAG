import {
  createMrJagAcademyService,
  installMrJag,
  listRegisteredLearningPaths,
} from "@mr-jag";
import { jsonOk, requireMrJagOrg } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireMrJagOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const { searchParams } = new URL(request.url);
  const persona = searchParams.get("persona");
  const pageId = searchParams.get("pageId");
  const academy = createMrJagAcademyService();
  if (pageId) {
    return jsonOk(
      { lesson: academy.lessonForPage(pageId) },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    {
      lessons: academy.lessonsForPersona(persona),
      paths: listRegisteredLearningPaths(
        persona ? { persona } : undefined
      ),
    },
    { correlationId: gate.correlationId }
  );
}
