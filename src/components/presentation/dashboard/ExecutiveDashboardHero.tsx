"use client";

import { useState } from "react";
import { ExecutiveDashboardHeroVisual } from "@/components/presentation/dashboard/ExecutiveDashboardHeroVisual";

/** Drop your dashboard screenshot at this path to replace the built-in visual. */
export const EXECUTIVE_DASHBOARD_HERO_IMAGE = "/presentation/executive-intelligence-dashboard.png";

export function ExecutiveDashboardHero() {
  const [imageFailed, setImageFailed] = useState(false);

  if (!imageFailed) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={EXECUTIVE_DASHBOARD_HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
          onError={() => setImageFailed(true)}
        />
        <div className="absolute inset-0 bg-slate-900/5" aria-hidden />
      </>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <ExecutiveDashboardHeroVisual />
    </div>
  );
}
