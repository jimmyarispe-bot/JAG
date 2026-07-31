import {
  createMrJagCoachService,
  installMrJag,
  type CoachTrigger,
} from "@mr-jag";
import { jsonOk, requireMrJagOrg, requireMrJagOrgBody } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireMrJagOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const { searchParams } = new URL(request.url);
  const trigger = (searchParams.get("trigger") ?? "first_login") as CoachTrigger;
  const tips = createMrJagCoachService().tipsForEvent({
    trigger,
    persona: searchParams.get("persona"),
  });
  return jsonOk({ tips }, { correlationId: gate.correlationId });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    persona?: string;
    events?: CoachTrigger[];
  };
  const gate = await requireMrJagOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const tips = createMrJagCoachService().observe({
    events: body.events ?? ["first_login"],
    persona: body.persona,
  });
  return jsonOk({ tips }, { correlationId: gate.correlationId, status: 201 });
}
