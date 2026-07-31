import {
  getPageLearningMetadata,
  installMrJag,
  listPageLearningMetadata,
  registerMrJagContent,
  type MrJagContentBundle,
} from "@mr-jag";
import { jsonOk, requireMrJagOrg, requireMrJagOrgBody } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireMrJagOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId");
  if (pageId) {
    return jsonOk(
      { tutorial: getPageLearningMetadata(pageId) },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    {
      tutorials: listPageLearningMetadata({
        productId: searchParams.get("productId") ?? undefined,
        persona: searchParams.get("persona") ?? undefined,
      }),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
  } & MrJagContentBundle;
  const gate = await requireMrJagOrgBody(body);
  if (!gate.ok) return gate.response;
  const result = registerMrJagContent({
    tutorials: body.tutorials,
    paths: body.paths,
    walkthroughs: body.walkthroughs,
  });
  return jsonOk(
    { registered: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}
