import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { guardApiRoute } from "@/lib/platform/identity/api-guard";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { requireSchoolAccess } from "@/lib/platform/identity/tenant-access";
import { checkRateLimitAsync, getClientIp, rateLimitResponse } from "@/lib/platform/api-rate-limit";

/** Secured scholarship estimate — requires auth; use admissions portal for public applications */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = await checkRateLimitAsync(`scholarship:${ip}`, 10, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfter);

  const supabase = await createAuthClient();
  const gate = await guardApiRoute(supabase, "scholarships.approve");
  if (gate instanceof NextResponse) return gate;

  const ctx = await getIdentityContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const applicationId = body.applicationId?.toString();
    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId required — submit scholarships through the admissions portal" },
        { status: 400 }
      );
    }

    // RC-3 — bind application to a school the actor can access (IDOR prevention).
    const { data: application, error: appError } = await supabase
      .from("admissions_applications")
      .select("id, lead_id")
      .eq("id", applicationId)
      .maybeSingle();

    if (appError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const { data: lead, error: leadError } = await supabase
      .from("admissions_leads")
      .select("school_id")
      .eq("id", application.lead_id)
      .maybeSingle();

    if (leadError || !lead?.school_id) {
      return NextResponse.json({ error: "Application school not found" }, { status: 404 });
    }

    const schoolScope = requireSchoolAccess(ctx, lead.school_id);
    if (schoolScope !== true) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const householdIncome = Number(body.householdIncome ?? 0);
    const familySize = Number(body.familySize ?? 0);
    const siblingCount = Number(body.siblingCount ?? 0);
    const specialCircumstanceScore = Number(body.specialCircumstanceScore ?? 0);

    let approvedAmount = 10000;
    if (householdIncome > 100000) approvedAmount -= 3000;
    else if (householdIncome > 60000) approvedAmount -= 1500;
    approvedAmount += familySize * 250 + siblingCount * 500 + specialCircumstanceScore * 50;
    approvedAmount = Math.max(1000, Math.round(approvedAmount));

    const { data, error } = await supabase
      .from("scholarship_applications")
      .upsert(
        {
          application_id: applicationId,
          requested_amount: approvedAmount,
          approved_amount: approvedAmount,
          scholarship_status: "submitted",
        },
        { onConflict: "application_id" }
      )
      .select("id, application_id, approved_amount, scholarship_status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, approvedAmount, application: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
