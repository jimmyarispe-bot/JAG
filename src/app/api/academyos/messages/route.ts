import {
  createCommunicationsEmployeePortalService,
  createCommunicationsParentPortalService,
  createMessagingService,
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
  const service = createMessagingService();
  const threadId = searchParams.get("threadId");
  if (threadId) {
    return jsonOk(
      {
        thread: service.getThread(gate.organizationId, threadId),
        messages: service.listMessages(gate.organizationId, threadId),
      },
      { correlationId: gate.correlationId }
    );
  }
  const items = service.search({
    organizationId: gate.organizationId,
    q: searchParams.get("q") ?? undefined,
    studentId: searchParams.get("studentId") ?? undefined,
    familyId: searchParams.get("familyId") ?? undefined,
    employeeId: searchParams.get("employeeId") ?? undefined,
    participantId: searchParams.get("participantId") ?? undefined,
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
    subject?: string;
    threadId?: string;
    body?: string;
    participantType?: "parent" | "employee" | "family" | "staff";
    participantIds?: string[];
    studentId?: string | null;
    familyId?: string | null;
    employeeId?: string | null;
    secure?: boolean;
    senderType?: "parent" | "employee" | "staff" | "system";
    senderId?: string;
  };

  if (body.action === "portal_send" && body.token && body.body) {
    const portal =
      body.portal === "employee"
        ? createCommunicationsEmployeePortalService()
        : createCommunicationsParentPortalService();
    const result = portal.sendMessage({
      token: body.token,
      subject: body.subject,
      threadId: body.threadId,
      body: body.body,
    });
    if (!result) return jsonError(JagErrors.notFound("Thread not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ message: result }, { status: 201 });
  }

  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  const service = createMessagingService();

  if (body.threadId && body.body) {
    const message = service.send({
      organizationId: gate.organizationId,
      threadId: body.threadId,
      body: body.body,
      senderType: body.senderType ?? "staff",
      senderId: body.senderId ?? gate.session.userId,
    });
    if (!message) return jsonError(JagErrors.notFound("Thread not found."));
    if ("error" in message) return jsonError(JagErrors.validation(message.error));
    return jsonOk(
      { message },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (!body.subject || !body.participantType || !body.participantIds?.length) {
    return jsonError(
      JagErrors.validation(
        "subject, participantType, and participantIds are required to open a thread."
      )
    );
  }
  const thread = service.openThread({
    organizationId: gate.organizationId,
    subject: body.subject,
    participantType: body.participantType,
    participantIds: body.participantIds,
    studentId: body.studentId,
    familyId: body.familyId,
    employeeId: body.employeeId,
    secure: body.secure,
    createdBy: gate.session.userId,
  });
  if ("error" in thread) return jsonError(JagErrors.validation(thread.error));
  return jsonOk(
    { thread },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    messageId?: string;
    readerId?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.messageId) {
    return jsonError(JagErrors.validation("messageId is required."));
  }
  const message = createMessagingService().markRead({
    organizationId: gate.organizationId,
    messageId: body.messageId,
    readerId: body.readerId ?? gate.session.userId,
  });
  if (!message) return jsonError(JagErrors.notFound("Message not found."));
  return jsonOk({ message }, { correlationId: gate.correlationId });
}
