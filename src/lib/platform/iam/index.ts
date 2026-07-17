/**
 * Sprint 014 — Identity & Access Foundation (platform IAM).
 *
 * Product-agnostic infrastructure. Product surfaces (applications) consume
 * this module; they must not be imported from here.
 */

export * from "@/lib/platform/iam/types";
export * from "@/lib/platform/iam/audit";
export * from "@/lib/platform/iam/permissions";
export * from "@/lib/platform/iam/roles";
export * from "@/lib/platform/iam/authorization";
export * from "@/lib/platform/iam/organizations";
export * from "@/lib/platform/iam/identity";
export * from "@/lib/platform/iam/delegation";
export * from "@/lib/platform/iam/break-glass";
export {
  createIamPlatform,
  type CreateIamPlatformOptions,
  type IamPlatform,
} from "@/lib/platform/iam/di";
