import {
  createAdmissionsScholarshipService,
  createFinanceScholarshipService,
  createScholarshipsService,
  listScholarshipAwards,
} from "@academyos";
import { paginate, parsePage } from "@academyos/api/pagination";
import {
  JagErrors,
  jsonError,
  jsonOk,
  requireAcademyOsOrg,
  requireAcademyOsOrgBody,
} from "@/app/api/academyos/_lib";

export async function GET(request: Request) {
  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  if (searchParams.get("view") === "awards") {
    const items = listScholarshipAwards(gate.organizationId, {
      familyAccountId: searchParams.get("familyAccountId") ?? undefined,
      studentId: searchParams.get("studentId") ?? undefined,
    });
    return jsonOk(
      { ...paginate(items, parsePage(searchParams)) },
      { correlationId: gate.correlationId }
    );
  }

  const items = createScholarshipsService().list(gate.organizationId);
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: string;
    applicantId?: string;
    programName?: string;
    amount?: number;
    eligibility?: "Eligible" | "Applied" | "Interested";
    documentationStatus?: "Pending" | "Complete";
    name?: string;
    fundingSource?: string;
    awardAmount?: number;
    familyAccountId?: string | null;
    studentId?: string | null;
    documentationComplete?: boolean;
    renewalDate?: string | null;
    expiresOn?: string | null;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;

  if (body.action === "award") {
    if (!body.fundingSource || body.awardAmount == null) {
      return jsonError(
        JagErrors.validation("fundingSource and awardAmount are required.")
      );
    }
    const award = createFinanceScholarshipService().award({
      organizationId: gate.organizationId,
      fundingSource: body.fundingSource,
      awardAmount: body.awardAmount,
      familyAccountId: body.familyAccountId,
      studentId: body.studentId,
      applicantId: body.applicantId,
      documentationComplete: body.documentationComplete,
      renewalDate: body.renewalDate,
      expiresOn: body.expiresOn,
      createdBy: gate.session.userId,
    });
    if ("error" in award) return jsonError(JagErrors.validation(award.error));
    return jsonOk(
      { award },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (body.action === "link" || body.applicantId) {
    if (!body.applicantId || !body.programName) {
      return jsonError(
        JagErrors.validation("applicantId and programName are required.")
      );
    }
    const result = createAdmissionsScholarshipService().link({
      organizationId: gate.organizationId,
      applicantId: body.applicantId,
      programName: body.programName,
      amount: body.amount ?? 0,
      eligibility: body.eligibility,
      documentationStatus: body.documentationStatus,
      actor: gate.session.userId,
    });
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk(result, { correlationId: gate.correlationId, status: 201 });
  }

  const created = createScholarshipsService().create({
    organizationId: gate.organizationId,
    name: body.name ?? body.programName ?? "Scholarship",
    amount: body.amount ?? 0,
    createdBy: gate.session.userId,
  });
  if ("error" in created) {
    return jsonError(JagErrors.validation(created.error));
  }
  return jsonOk(
    { scholarship: created },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    awardId?: string;
    documentationComplete?: boolean;
    renewalDate?: string | null;
    expiresOn?: string | null;
    status?: "Pending" | "Active" | "Exhausted" | "Expired" | "Revoked";
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.awardId) {
    return jsonError(JagErrors.validation("awardId is required."));
  }
  const patched = createFinanceScholarshipService().patch({
    organizationId: gate.organizationId,
    awardId: body.awardId,
    documentationComplete: body.documentationComplete,
    renewalDate: body.renewalDate,
    expiresOn: body.expiresOn,
    status: body.status,
    actor: gate.session.userId,
  });
  if (!patched) return jsonError(JagErrors.notFound("Award not found."));
  return jsonOk({ award: patched }, { correlationId: gate.correlationId });
}
