import type { ReactNode } from "react";

export const metadata = {
  title: "Jimmy Arispe Leadership Presentation | MICMS",
  description: "Marco Island Charter Middle School — Executive Leadership Presentation",
};

export default function MicmsLeadershipPresentationLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white antialiased">{children}</div>
  );
}
