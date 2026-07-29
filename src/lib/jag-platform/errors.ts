/**
 * Standardized platform error contract for The JAG™ portal APIs.
 */

import { randomUUID } from "node:crypto";

export type JagRetryRecommendation =
  | "none"
  | "retry"
  | "retry_later"
  | "reconnect"
  | "contact_support";

export type JagPlatformError = {
  readonly errorCode: string;
  readonly userMessage: string;
  readonly internalMessage: string;
  readonly correlationId: string;
  readonly retryRecommendation: JagRetryRecommendation;
  readonly status: number;
  readonly details?: Readonly<Record<string, string>>;
};

export function createJagPlatformError(input: {
  errorCode: string;
  userMessage: string;
  internalMessage?: string;
  retryRecommendation?: JagRetryRecommendation;
  status?: number;
  correlationId?: string;
  details?: Record<string, string>;
}): JagPlatformError {
  return {
    errorCode: input.errorCode,
    userMessage: input.userMessage,
    internalMessage: input.internalMessage ?? input.userMessage,
    correlationId: input.correlationId ?? randomUUID(),
    retryRecommendation: input.retryRecommendation ?? "none",
    status: input.status ?? 400,
    details: input.details ? Object.freeze({ ...input.details }) : undefined,
  };
}

export const JagErrors = {
  unauthorized: (correlationId?: string) =>
    createJagPlatformError({
      errorCode: "AUTH_UNAUTHORIZED",
      userMessage: "You must sign in to continue.",
      internalMessage: "Missing or invalid jag_platform_session.",
      status: 401,
      correlationId,
      retryRecommendation: "none",
    }),
  forbidden: (correlationId?: string) =>
    createJagPlatformError({
      errorCode: "AUTH_FORBIDDEN",
      userMessage: "You do not have permission to perform this action.",
      internalMessage: "Authorization boundary rejected the request.",
      status: 403,
      correlationId,
      retryRecommendation: "none",
    }),
  orgDenied: (correlationId?: string) =>
    createJagPlatformError({
      errorCode: "ORG_ACCESS_DENIED",
      userMessage: "Organization access denied.",
      internalMessage: "Session cannot access the requested organizationId.",
      status: 403,
      correlationId,
      retryRecommendation: "none",
    }),
  notFound: (entity: string, correlationId?: string) =>
    createJagPlatformError({
      errorCode: "NOT_FOUND",
      userMessage: `${entity} was not found.`,
      status: 404,
      correlationId,
    }),
  validation: (userMessage: string, details?: Record<string, string>) =>
    createJagPlatformError({
      errorCode: "VALIDATION_ERROR",
      userMessage,
      status: 400,
      details,
      retryRecommendation: "none",
    }),
  conflict: (userMessage: string) =>
    createJagPlatformError({
      errorCode: "CONFLICT",
      userMessage,
      status: 409,
    }),
} as const;

/** Public API error body — never exposes secrets. */
export function toPublicErrorBody(error: JagPlatformError): {
  ok: false;
  error: string;
  errorCode: string;
  correlationId: string;
  retryRecommendation: JagRetryRecommendation;
  details?: Readonly<Record<string, string>>;
} {
  return {
    ok: false,
    error: error.userMessage,
    errorCode: error.errorCode,
    correlationId: error.correlationId,
    retryRecommendation: error.retryRecommendation,
    details: error.details,
  };
}
