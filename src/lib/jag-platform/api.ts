/**
 * Common API helpers — consistent validation, auth, pagination, responses.
 */

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  JagErrors,
  toPublicErrorBody,
  type JagPlatformError,
} from "@/lib/jag-platform/errors";
import { jagLogger } from "@/lib/jag-platform/logging";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { canViewPlatformHealth } from "@/lib/jag-platform/admin-access";

export type JagApiSuccess<T extends Record<string, unknown>> = {
  ok: true;
} & T;

export type PaginationInput = {
  readonly page: number;
  readonly pageSize: number;
};

export type Paginated<T> = {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
};

export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { pageSize?: number; maxPageSize?: number } = {}
): PaginationInput {
  const max = defaults.maxPageSize ?? 100;
  const defaultSize = defaults.pageSize ?? 25;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const rawSize = Number(searchParams.get("pageSize") ?? String(defaultSize)) || defaultSize;
  const pageSize = Math.min(max, Math.max(1, rawSize));
  return { page, pageSize };
}

export function paginateItems<T>(
  items: readonly T[],
  pagination: PaginationInput
): Paginated<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
  const page = Math.min(pagination.page, totalPages);
  const start = (page - 1) * pagination.pageSize;
  return {
    items: items.slice(start, start + pagination.pageSize),
    page,
    pageSize: pagination.pageSize,
    total,
    totalPages,
  };
}

export function jsonOk<T extends Record<string, unknown>>(
  body: T,
  init?: { status?: number; correlationId?: string }
): NextResponse {
  const correlationId = init?.correlationId ?? randomUUID();
  return NextResponse.json(
    { ok: true, correlationId, ...body },
    {
      status: init?.status ?? 200,
      headers: { "x-correlation-id": correlationId },
    }
  );
}

export function jsonError(error: JagPlatformError): NextResponse {
  jagLogger.error("api", error.internalMessage, {
    correlationId: error.correlationId,
    metadata: {
      errorCode: error.errorCode,
      status: error.status,
    },
  });
  return NextResponse.json(toPublicErrorBody(error), {
    status: error.status,
    headers: { "x-correlation-id": error.correlationId },
  });
}

export async function requireJagApiSession(): Promise<
  | { ok: true; session: JagPlatformSession; correlationId: string }
  | { ok: false; response: NextResponse }
> {
  const correlationId = randomUUID();
  const session = await getJagPlatformSession();
  if (!session) {
    return {
      ok: false,
      response: jsonError(JagErrors.unauthorized(correlationId)),
    };
  }
  return { ok: true, session, correlationId };
}

export async function requireJagApiAdmin(): Promise<
  | { ok: true; session: JagPlatformSession; correlationId: string }
  | { ok: false; response: NextResponse }
> {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate;
  if (!canViewPlatformHealth(gate.session)) {
    jagLogger.security("api", "Platform health access denied", {
      correlationId: gate.correlationId,
      metadata: { userId: gate.session.userId, role: gate.session.role },
    });
    return {
      ok: false,
      response: jsonError(JagErrors.forbidden(gate.correlationId)),
    };
  }
  return gate;
}

export function requireOrganizationId(
  organizationId: string | null | undefined,
  canAccess: (organizationId: string) => boolean,
  correlationId?: string
):
  | { ok: true; organizationId: string }
  | { ok: false; response: NextResponse } {
  const id = (organizationId ?? "").trim();
  if (!id) {
    return {
      ok: false,
      response: jsonError(
        JagErrors.validation("organizationId is required.", {
          organizationId: "Required",
        })
      ),
    };
  }
  if (!canAccess(id)) {
    return {
      ok: false,
      response: jsonError(JagErrors.orgDenied(correlationId)),
    };
  }
  return { ok: true, organizationId: id };
}
