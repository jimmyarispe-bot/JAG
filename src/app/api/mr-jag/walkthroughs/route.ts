import {
  createMrJagWalkthroughEngine,
  installMrJag,
  listRegisteredWalkthroughs,
} from "@mr-jag";
import { jsonOk, requireMrJagOrg, requireMrJagOrgBody } from "../_lib";

type WalkthroughAction =
  | "start"
  | "advance"
  | "advanceAutomatically"
  | "resume"
  | "pause"
  | "restart"
  | "skip"
  | "markComplete"
  | "setAutoAdvance";

export async function GET(request: Request) {
  const gate = await requireMrJagOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId") ?? undefined;
  const persona = searchParams.get("persona") ?? undefined;
  const engine = createMrJagWalkthroughEngine();
  return jsonOk(
    {
      walkthroughs: listRegisteredWalkthroughs({ pageId, persona }),
      contextAware:
        pageId != null
          ? engine.forContext({ pageId, persona })
          : [],
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    walkthroughId?: string;
    action?: WalkthroughAction;
    autoAdvance?: boolean;
    enabled?: boolean;
  };
  const gate = await requireMrJagOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createMrJagWalkthroughEngine();
  const action: WalkthroughAction = body.action ?? "start";
  const input = {
    walkthroughId: body.walkthroughId ?? "",
    userId: gate.session.userId,
    organizationId: gate.organizationId,
  };

  let session;
  switch (action) {
    case "advance":
      session = engine.advance(input);
      break;
    case "advanceAutomatically":
      session = engine.advanceAutomatically(input);
      break;
    case "resume":
      session = engine.resume(input);
      break;
    case "pause":
      session = engine.pause(input);
      break;
    case "restart":
      session = engine.restart(input);
      break;
    case "skip":
      session = engine.skip(input);
      break;
    case "markComplete":
      session = engine.markComplete(input);
      break;
    case "setAutoAdvance":
      session = engine.setAutoAdvance({
        ...input,
        enabled: body.enabled ?? body.autoAdvance ?? true,
      });
      break;
    case "start":
    default:
      session = engine.start({
        ...input,
        autoAdvance: body.autoAdvance,
      });
      break;
  }

  return jsonOk(
    { session },
    { correlationId: gate.correlationId, status: 201 }
  );
}
