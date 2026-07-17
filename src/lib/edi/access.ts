import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasAnyPermission } from "@/lib/platform/identity/authorization-service";

export function canViewEdi(ctx: IdentityContext) {
  return hasAnyPermission(ctx, [
    "edi.view",
    "edi.executive",
    "edi.manage",
    "edi.board",
    "executive.intelligence",
  ]);
}

export function canManageEdi(ctx: IdentityContext) {
  return hasAnyPermission(ctx, ["edi.manage", "edi.executive"]);
}

export function canAccessEdiBoard(ctx: IdentityContext) {
  return hasAnyPermission(ctx, [
    "edi.board",
    "executive.board_reports",
    "edi.executive",
  ]);
}
