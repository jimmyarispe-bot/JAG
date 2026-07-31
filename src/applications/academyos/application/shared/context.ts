export type ApplicationContext = {
  actorUserId: string;
  organizationId?: string | null;
  permissions: ReadonlySet<string> | readonly string[];
};

export function hasPermission(
  ctx: ApplicationContext,
  permission: string
): boolean {
  const granted = ctx.permissions;
  if (granted instanceof Set) return granted.has(permission);
  if (Array.isArray(granted)) return granted.includes(permission);
  return (granted as ReadonlySet<string>).has(permission);
}

export function requirePermission(
  ctx: ApplicationContext,
  permission: string
): { ok: true } | { ok: false; code: string; message: string } {
  if (hasPermission(ctx, permission)) return { ok: true };
  return {
    ok: false,
    code: "forbidden",
    message: `Missing permission: ${permission}`,
  };
}
