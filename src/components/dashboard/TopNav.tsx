"use client";

import { getModuleByPath } from "@/lib/dashboard/navigation";
import {
  NotificationCenter,
  type NavNotificationItem,
} from "@/components/communications/NotificationCenter";
import { useBranding } from "@/components/branding/BrandingContext";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { usePathname } from "next/navigation";

interface TopNavProps {
  fullName: string;
  roleLabel: string;
  notifications?: NavNotificationItem[];
  onMenuClick: () => void;
}

export function TopNav({ fullName, roleLabel, notifications = [], onMenuClick }: TopNavProps) {
  const pathname = usePathname();
  const branding = useBranding();
  const currentModule = getModuleByPath(pathname, branding);

  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 lg:hidden"
          aria-label="Open navigation menu"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
            {currentModule.pageTitle}
          </h1>
          <p className="hidden text-sm text-slate-500 sm:block">
            {currentModule.pageSubtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <NotificationCenter notifications={notifications} />
        <UserMenu
          fullName={fullName}
          roleLabel={roleLabel}
          initials={initials}
          productName={branding.productName}
        />
      </div>
    </header>
  );
}
