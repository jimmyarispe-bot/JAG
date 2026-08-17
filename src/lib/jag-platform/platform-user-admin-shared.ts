/**
 * Client-safe constants and types for JAG platform user administration.
 * No server imports — this module is safe to import from "use client" components.
 */

/** user_metadata key stamped when a JAG platform identity is deactivated. */
export const JAG_DEACTIVATED_METADATA_KEY = "jag_deactivated_at" as const;

/**
 * JAG platform roles an administrator may assign from this screen.
 * FOUNDER is deliberately excluded — it is never granted or removed here.
 */
export const JAG_ASSIGNABLE_ROLES = [
  "PLATFORM_OWNER",
  "PLATFORM_ADMIN",
] as const;

export type JagAssignableRole = (typeof JAG_ASSIGNABLE_ROLES)[number];

export function isJagAssignableRole(value: string): value is JagAssignableRole {
  return (JAG_ASSIGNABLE_ROLES as readonly string[]).includes(value);
}

export type JagPlatformUserStatus = {
  readonly userId: string;
  /** ISO timestamp when deactivated, or null when active. */
  readonly deactivatedAt: string | null;
};
