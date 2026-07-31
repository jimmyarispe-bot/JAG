import { createAnnouncementService } from "@academyos";
import type { AnnouncementScope } from "@academyos/communications";
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
  const service = createAnnouncementService();
  const announcementId = searchParams.get("announcementId");
  if (announcementId) {
    return jsonOk(
      { announcement: service.get(gate.organizationId, announcementId) },
      { correlationId: gate.correlationId }
    );
  }
  if (searchParams.get("feed") === "active") {
    return jsonOk(
      {
        announcements: service.activeFeed({
          organizationId: gate.organizationId,
          scope: (searchParams.get("scope") as AnnouncementScope) || undefined,
          scopeTargetId: searchParams.get("scopeTargetId") ?? undefined,
        }),
      },
      { correlationId: gate.correlationId }
    );
  }
  const items = service.search({
    organizationId: gate.organizationId,
    q: searchParams.get("q") ?? undefined,
    scope: (searchParams.get("scope") as AnnouncementScope) || undefined,
  });
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    title?: string;
    body?: string;
    scope?: AnnouncementScope;
    scopeTargetId?: string | null;
    expiresAt?: string | null;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.title || !body.body || !body.scope) {
    return jsonError(
      JagErrors.validation("title, body, and scope are required.")
    );
  }
  const created = createAnnouncementService().create({
    organizationId: gate.organizationId,
    title: body.title,
    body: body.body,
    scope: body.scope,
    scopeTargetId: body.scopeTargetId,
    expiresAt: body.expiresAt,
    createdBy: gate.session.userId,
  });
  if ("error" in created) return jsonError(JagErrors.validation(created.error));
  return jsonOk(
    { announcement: created },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    announcementId?: string;
    action?: "publish" | "read";
    readerId?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.announcementId) {
    return jsonError(JagErrors.validation("announcementId is required."));
  }
  const service = createAnnouncementService();
  if (body.action === "read") {
    const read = service.markRead({
      organizationId: gate.organizationId,
      announcementId: body.announcementId,
      readerId: body.readerId ?? gate.session.userId,
    });
    if (!read) return jsonError(JagErrors.notFound("Announcement not found."));
    return jsonOk({ announcement: read }, { correlationId: gate.correlationId });
  }
  const published = service.publish({
    organizationId: gate.organizationId,
    announcementId: body.announcementId,
    actor: gate.session.userId,
  });
  if (!published) return jsonError(JagErrors.notFound("Announcement not found."));
  return jsonOk(
    { announcement: published },
    { correlationId: gate.correlationId }
  );
}
