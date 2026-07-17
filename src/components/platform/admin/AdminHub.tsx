import Link from "next/link";
import {
  hasPermission,
  type AuthzSubject,
} from "@/lib/platform/identity/authorization-service";
import {
  PLATFORM_ADMINISTRATION_NAV,
  type PlatformAdministrationNavItem,
} from "@/lib/dashboard/platform-administration";

interface AdminHubProps {
  /** Effective permission keys or full authz subject. */
  permissions: readonly string[] | AuthzSubject;
}

function toSubject(permissions: AdminHubProps["permissions"]): AuthzSubject {
  if (Array.isArray(permissions) || permissions instanceof Set) {
    return { permissions };
  }
  if (
    typeof permissions === "object" &&
    permissions !== null &&
    "permissions" in permissions
  ) {
    return permissions as AuthzSubject;
  }
  return { permissions: [] };
}

export function AdminHub({ permissions }: AdminHubProps) {
  const subject = toSubject(permissions);
  const links = PLATFORM_ADMINISTRATION_NAV.filter((item) =>
    hasPermission(subject, item.permission)
  ) as PlatformAdministrationNavItem[];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => (
        <Link
          key={link.id}
          href={link.href}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
        >
          <h3 className="font-semibold text-slate-900">{link.label}</h3>
          <p className="mt-1 text-sm text-slate-500">{link.description}</p>
          <p className="mt-3 text-xs font-medium text-brand-600">Open →</p>
        </Link>
      ))}
      {links.length === 0 && (
        <p className="col-span-full text-sm text-slate-500">
          No administration sections are available for your permissions.
        </p>
      )}
    </div>
  );
}
