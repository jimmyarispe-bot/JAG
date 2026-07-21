"use client";

/**
 * RC-1 — silent RUM reporter (no UI). Captures CWV + TTFB and posts to /api/observability/rum.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

function deviceClass(): "mobile" | "tablet" | "desktop" | "unknown" {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (ua) return "desktop";
  return "unknown";
}

function browserLabel(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "edge";
  if (ua.includes("Chrome/")) return "chrome";
  if (ua.includes("Firefox/")) return "firefox";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "safari";
  return "other";
}

function postMetric(metric: Metric, route: string) {
  const payload = {
    name: metric.name,
    value: metric.name === "CLS" ? metric.value : Math.round(metric.value * 100) / 100,
    route,
    browser: browserLabel(),
    deviceClass: deviceClass(),
    navigationType: metric.navigationType,
    organizationId:
      typeof document !== "undefined"
        ? document.documentElement.dataset.orgId
        : undefined,
  };

  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/observability/rum", blob);
    return;
  }
  void fetch("/api/observability/rum", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

/** Approximate TTI via idle after LCP + network quiet (best-effort; not a lab TTI). */
function reportApproximateTti(route: string) {
  if (typeof window === "undefined" || typeof performance === "undefined") return;
  const send = () => {
    const tti = Math.round(performance.now() * 100) / 100;
    void fetch("/api/observability/rum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "TTI",
        value: tti,
        route,
        browser: browserLabel(),
        deviceClass: deviceClass(),
      }),
      keepalive: true,
    });
  };
  if ("requestIdleCallback" in window) {
    (
      window as Window & {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
      }
    ).requestIdleCallback(send, { timeout: 5000 });
  } else {
    setTimeout(send, 0);
  }
}

export function WebVitalsReporter() {
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    const report = (metric: Metric) => postMetric(metric, pathname);
    onCLS(report);
    onFCP(report);
    onINP(report);
    onLCP(report);
    onTTFB(report);
    reportApproximateTti(pathname);
  }, [pathname]);

  return null;
}
