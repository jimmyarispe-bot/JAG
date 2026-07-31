import {
  createCommunicationsEmployeePortalService,
  createCommunicationsParentPortalService,
  createCommunicationsReportingService,
  createNotificationService,
  type CommunicationChannel,
  type CommunicationDomain,
  type CommunicationsReportKind,
} from "@academyos";
import type { NotificationStatus } from "@academyos/communications";
import { paginate, parsePage } from "@academyos/api/pagination";
import {
  JagErrors,
  jsonError,
  jsonOk,
  requireAcademyOsOrg,
  requireAcademyOsOrgBody,
} from "@/app/api/academyos/_lib";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const portal = searchParams.get("portal");
  if (token && portal === "parent") {
    const result = createCommunicationsParentPortalService().resolve(token);
    if ("error" in result) return jsonError(JagErrors.unauthorized());
    return jsonOk(result);
  }
  if (token && portal === "employee") {
    const result = createCommunicationsEmployeePortalService().resolve(token);
    if ("error" in result) return jsonError(JagErrors.unauthorized());
    return jsonOk(result);
  }

  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;

  const report = searchParams.get("report") as CommunicationsReportKind | null;
  if (report) {
    return jsonOk(
      {
        report: createCommunicationsReportingService().generate(
          gate.organizationId,
          report
        ),
      },
      { correlationId: gate.correlationId }
    );
  }

  const service = createNotificationService();
  const notificationId = searchParams.get("notificationId");
  if (notificationId) {
    return jsonOk(
      { notification: service.get(gate.organizationId, notificationId) },
      { correlationId: gate.correlationId }
    );
  }

  const items = service.search({
    organizationId: gate.organizationId,
    q: searchParams.get("q") ?? undefined,
    domain: (searchParams.get("domain") as CommunicationDomain) || undefined,
    status: (searchParams.get("status") as NotificationStatus) || undefined,
    recipientId: searchParams.get("recipientId") ?? undefined,
    studentId: searchParams.get("studentId") ?? undefined,
    employeeId: searchParams.get("employeeId") ?? undefined,
    channel: (searchParams.get("channel") as CommunicationChannel) || undefined,
  });
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    token?: string;
    portal?: string;
    action?: string;
    domain?: CommunicationDomain;
    eventKey?: string;
    recipientType?: "parent" | "employee" | "family" | "staff" | "system";
    recipientId?: string;
    title?: string;
    body?: string;
    channel?: CommunicationChannel;
    studentId?: string | null;
    familyId?: string | null;
    employeeId?: string | null;
    variables?: Record<string, string>;
    channels?: CommunicationChannel[];
    mutedDomains?: CommunicationDomain[];
    notificationId?: string;
  };

  if (body.action === "portal_set_preferences" && body.token) {
    const portal =
      body.portal === "employee"
        ? createCommunicationsEmployeePortalService()
        : createCommunicationsParentPortalService();
    const result = portal.setPreferences({
      token: body.token,
      channels: body.channels ?? ["in_app"],
      mutedDomains: body.mutedDomains,
    });
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ preferences: result });
  }

  if (body.action === "portal_mark_read" && body.token && body.notificationId) {
    const result = createCommunicationsParentPortalService().markNotificationRead(
      {
        token: body.token,
        notificationId: body.notificationId,
      }
    );
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ notification: result });
  }

  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.domain || !body.eventKey || !body.recipientType || !body.recipientId) {
    return jsonError(
      JagErrors.validation(
        "domain, eventKey, recipientType, and recipientId are required."
      )
    );
  }
  const created = createNotificationService().fromDomainEvent({
    organizationId: gate.organizationId,
    domain: body.domain,
    eventKey: body.eventKey,
    recipientType: body.recipientType,
    recipientId: body.recipientId,
    title: body.title,
    body: body.body,
    channel: body.channel,
    studentId: body.studentId,
    familyId: body.familyId,
    employeeId: body.employeeId,
    variables: body.variables,
    createdBy: gate.session.userId,
  });
  if ("error" in created) return jsonError(JagErrors.validation(created.error));
  return jsonOk(
    { notifications: created },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    notificationId?: string;
    action?: "read" | "fail";
    reason?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.notificationId) {
    return jsonError(JagErrors.validation("notificationId is required."));
  }
  const service = createNotificationService();
  if (body.action === "fail") {
    const failed = service.markFailed({
      organizationId: gate.organizationId,
      notificationId: body.notificationId,
      reason: body.reason ?? "Delivery failed",
      actor: gate.session.userId,
    });
    if (!failed) return jsonError(JagErrors.notFound("Notification not found."));
    return jsonOk({ notification: failed }, { correlationId: gate.correlationId });
  }
  const read = service.markRead({
    organizationId: gate.organizationId,
    notificationId: body.notificationId,
    actor: gate.session.userId,
  });
  if (!read) return jsonError(JagErrors.notFound("Notification not found."));
  return jsonOk({ notification: read }, { correlationId: gate.correlationId });
}
