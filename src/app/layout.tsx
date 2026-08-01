import "./globals.css";
import type { Metadata } from "next";
import { InteractionProviders } from "@/components/experience-system/feedback/InteractionProviders";
import { WebVitalsReporter } from "@/components/observability/WebVitalsReporter";
import {
  CANONICAL_JAG_PRODUCTION_ORIGIN,
  THE_JAG_MARK,
} from "@/lib/platform/branding";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl || CANONICAL_JAG_PRODUCTION_ORIGIN),
  title: {
    default: THE_JAG_MARK,
    template: `%s · ${THE_JAG_MARK}`,
  },
  description: "Organizational Intelligence Operating System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <InteractionProviders>
          {children}
          <WebVitalsReporter />
        </InteractionProviders>
      </body>
    </html>
  );
}
