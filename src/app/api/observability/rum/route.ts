import { NextResponse } from "next/server";
import { isRumMetricName, recordRumSample } from "@/lib/observability";

/**
 * RC-1 — RUM beacon endpoint (Core Web Vitals + TTFB/TTI).
 * Public POST; samples are capped and contain no secrets.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sampleRate = Number(process.env.NEXT_PUBLIC_RUM_SAMPLE_RATE ?? "1");
  if (Number.isFinite(sampleRate) && sampleRate < 1 && Math.random() > sampleRate) {
    return NextResponse.json({ ok: true, sampled: false }, { status: 202 });
  }

  const items = Array.isArray(body) ? body : [body];
  let accepted = 0;

  for (const item of items.slice(0, 12)) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const name = typeof row.name === "string" ? row.name : "";
    const value = typeof row.value === "number" ? row.value : Number(row.value);
    const route = typeof row.route === "string" ? row.route.slice(0, 200) : "/";
    if (!isRumMetricName(name) || !Number.isFinite(value)) continue;
    if (value < 0 || value > 120_000) continue;

    recordRumSample({
      name,
      value,
      route,
      organizationId:
        typeof row.organizationId === "string"
          ? row.organizationId.slice(0, 64)
          : undefined,
      browser: typeof row.browser === "string" ? row.browser.slice(0, 80) : undefined,
      deviceClass:
        row.deviceClass === "mobile" ||
        row.deviceClass === "tablet" ||
        row.deviceClass === "desktop" ||
        row.deviceClass === "unknown"
          ? row.deviceClass
          : "unknown",
      navigationType:
        typeof row.navigationType === "string"
          ? row.navigationType.slice(0, 40)
          : undefined,
    });
    accepted += 1;
  }

  return NextResponse.json(
    { ok: true, accepted },
    { status: 202, headers: { "Cache-Control": "no-store" } }
  );
}
