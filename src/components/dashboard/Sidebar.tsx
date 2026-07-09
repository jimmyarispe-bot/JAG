"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  getBrandedDashboardModules,
  isModuleActive,
} from "@/lib/dashboard/navigation";
import {
  FOUNDERS_PLATFORM_NAV,
  FOUNDERS_UTILITY_NAV,
  resolvePlatformNavLabel,
} from "@/lib/dashboard/founders-navigation";
import { useBranding } from "@/components/branding/BrandingContext";
import { cn } from "@/components/workspace-design-system/utils";
import { ModuleIcon } from "./ModuleIcons";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function isPlatformActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/admin") return pathname.startsWith("/dashboard/admin");
  if (href === "/dashboard/data") return pathname.startsWith("/dashboard/data");
  if (href === "/dashboard/integrations") return pathname.startsWith("/dashboard/integrations");
  return pathname.startsWith(href);
}

const navLinkClass = (active: boolean) =>
  cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    active
      ? "bg-brand-600 text-white shadow-sm"
      : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
  );

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const branding = useBranding();
  const modules = getBrandedDashboardModules(branding);
  const footerTagline = branding.editionLabel
    ? `${branding.productName} — ${branding.editionLabel}`
    : branding.productName;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    onCloseRef.current();
  }, [pathname]);

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-y-0 right-0 left-72 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "flex w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:transition-transform max-lg:duration-200",
          open
            ? "max-lg:translate-x-0"
            : "max-lg:pointer-events-none max-lg:-translate-x-full",
          "lg:relative"
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            {branding.monogram}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{branding.productName}</p>
            <p className="text-xs text-slate-400">{branding.productTagline}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Modules
          </p>
          <ul className="space-y-1">
            {modules.map((module) => {
              const active = isModuleActive(pathname, module);
              return (
                <li key={module.id}>
                  <Link href={module.href} className={navLinkClass(active)}>
                    <ModuleIcon moduleId={module.id} />
                    {module.sidebarLabel}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Platform
          </p>
          {FOUNDERS_PLATFORM_NAV.map((item, index) => {
            const active = isPlatformActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(index > 0 && "mt-1", navLinkClass(active))}
              >
                {resolvePlatformNavLabel(item.labelKey, branding)}
              </Link>
            );
          })}
          {FOUNDERS_UTILITY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn("mt-1", navLinkClass(pathname.startsWith(item.href)))}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-slate-500">{footerTagline}</p>
        </div>
      </aside>
    </>
  );
}
