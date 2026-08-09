import "./globals.css";
import type { Metadata } from "next";
import { InteractionProviders } from "@/components/experience-system/feedback/InteractionProviders";
import { WebVitalsReporter } from "@/components/observability/WebVitalsReporter";
import {
  CANONICAL_JAG_PRODUCTION_ORIGIN,
  resolvePublicAppOrigin,
  THE_JAG_MARK,
} from "@/lib/platform/branding";

const appUrl = resolvePublicAppOrigin();
const productDescription =
  "The JAG™ Organizational Intelligence Operating System";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl || CANONICAL_JAG_PRODUCTION_ORIGIN),
  title: {
    default: THE_JAG_MARK,
    template: `%s · ${THE_JAG_MARK}`,
  },
  description: productDescription,
  applicationName: THE_JAG_MARK,
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: CANONICAL_JAG_PRODUCTION_ORIGIN,
    siteName: THE_JAG_MARK,
    title: THE_JAG_MARK,
    description: productDescription,
  },
  twitter: {
    card: "summary",
    title: THE_JAG_MARK,
    description: productDescription,
  },
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
