import {
  hasPermission,
  type AuthzSubject,
} from "@/lib/platform/identity/authorization-service";
import {
  PLATFORM_ADMINISTRATION_NAV,
  type PlatformAdministrationNavItem,
} from "@/lib/dashboard/platform-administration";
import { ModuleCard } from "@/components/experience-system/cards";

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
        <ModuleCard
          key={link.id}
          title={link.label}
          description={link.description}
          href={link.href}
          className="hover:border-brand-300"
          titleClassName="text-base"
          descriptionClassName="text-sm"
        />
      ))}
      {links.length === 0 && (
        <p className="col-span-full text-sm text-slate-500">
          No administration sections are available for your permissions.
        </p>
      )}
    </div>
  );
}
