import "./globals.css";
import { InteractionProviders } from "@/components/experience-system/feedback/InteractionProviders";
import { WebVitalsReporter } from "@/components/observability/WebVitalsReporter";

export const metadata = {
  title: "School Platform",
  description: "Education Operating System",
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
