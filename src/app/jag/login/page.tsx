import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { JagLoginForm } from "@/components/jag-platform/JagLoginForm";
import { loadJagBrandForHost } from "@/lib/jag-command-center/branding";
import { JAG_PLATFORM_HOME_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { POWERED_BY_LINE } from "@/lib/platform/branding";

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? undefined;
  const model = loadJagBrandForHost(host);
  return {
    title: model.pageTitle,
    description: `${model.pageTitle}. ${POWERED_BY_LINE}`,
    icons: model.theme.icons.favicon
      ? { icon: model.theme.icons.favicon }
      : undefined,
  };
}

function firstQueryValue(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function JagLoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
    reset?: string | string[];
  }>;
}) {
  const session = await getJagPlatformSession();
  if (session) {
    redirect(JAG_PLATFORM_HOME_PATH);
  }

  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? undefined;
  const model = loadJagBrandForHost(host);
  const bg = model.brand.login_background_url;
  const params = await searchParams;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: model.brand.primary_color || "#0F172A",
        backgroundImage: bg
          ? `linear-gradient(to bottom, color-mix(in srgb, ${model.brand.primary_color} 72%, transparent), color-mix(in srgb, ${model.brand.secondary_color} 88%, transparent)), url("${bg}")`
          : `linear-gradient(to bottom, ${model.brand.primary_color}, ${model.brand.secondary_color})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <JagLoginForm
        brand={model.brand}
        next={firstQueryValue(params.next)}
        error={firstQueryValue(params.error)}
        reset={firstQueryValue(params.reset)}
      />
    </div>
  );
}
