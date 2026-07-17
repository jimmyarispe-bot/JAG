import "./globals.css";
import { LiveAnnouncerProvider } from "@/components/experience-system/feedback/LiveAnnouncer";

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
        <LiveAnnouncerProvider>{children}</LiveAnnouncerProvider>
      </body>
    </html>
  );
}
