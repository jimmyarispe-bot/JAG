import { NextResponse } from "next/server";
import {
  buildQuickBooksAuthorizeUrl,
  canAccessConnectorOrganization,
  connectQuickBooksDemo,
  quickbooksClientConfig,
} from "@/lib/connectors";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

/**
 * POST — start QuickBooks OAuth or complete demo connect.
 */
export async function POST(request: Request) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    organizationId?: string;
    demo?: boolean;
    companyName?: string;
    scheduleFrequency?: "Manual" | "Daily" | "Weekly";
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const organizationId = body.organizationId ?? "";
  if (!organizationId || !canAccessConnectorOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }

  const { configured } = quickbooksClientConfig();
  const useDemo = body.demo === true || !configured;

  if (useDemo) {
    const installation = connectQuickBooksDemo({
      organizationId,
      companyName: body.companyName,
      scheduleFrequency: body.scheduleFrequency,
    });
    return NextResponse.json({
      ok: true,
      demo: true,
      installation,
      message: configured
        ? "Connected (demo mode)."
        : "Connected in demo mode — set QUICKBOOKS_CLIENT_ID/SECRET for live OAuth.",
    });
  }

  const auth = buildQuickBooksAuthorizeUrl({
    organizationId,
    userId: session.userId,
  });
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    demo: false,
    authorizeUrl: auth.authorizeUrl,
  });
}
