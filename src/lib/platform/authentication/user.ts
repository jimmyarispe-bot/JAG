import type { AuthUser } from "@/lib/platform/authentication/types";

export function authUserDisplayName(user: AuthUser | null | undefined): string {
  if (!user) return "User";
  const metaName = user.userMetadata.full_name;
  if (typeof metaName === "string" && metaName.trim()) return metaName.trim();
  const email = user.email ?? "";
  return email.split("@")[0]?.replace(/\./g, " ") || "User";
}

export function authUserMustResetPassword(user: AuthUser | null | undefined): boolean {
  return user?.userMetadata?.must_reset_password === true;
}

export function authUserNeedsInviteActivation(
  user: AuthUser | null | undefined
): boolean {
  return user?.userMetadata?.invite_activation === true;
}
