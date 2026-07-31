import { NextResponse } from "next/server";
import {
  canAccessConnectorOrganization,
  QBO_SCHEDULES,
  updateQuickBooksSchedule,
} from "@/lib/connectors";
import type { ScheduleFrequency } from "@/lib/connectors/types";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export async function POST(request: Request) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    organizationId?: string;
    scheduleFrequency?: ScheduleFrequency;
  };
  const organizationId = body.organizationId ?? "";
  if (!organizationId || !canAccessConnectorOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }

  const frequency = body.scheduleFrequency;
  if (!frequency || !QBO_SCHEDULES.includes(frequency)) {
    return NextResponse.json(
      {
        ok: false,
        error: "scheduleFrequency must be Manual, Daily, or Weekly.",
      },
      { status: 400 }
    );
  }

  const installation = updateQuickBooksSchedule(organizationId, frequency);
  if (!installation) {
    return NextResponse.json(
      { ok: false, error: "QuickBooks installation not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, installation });
}
