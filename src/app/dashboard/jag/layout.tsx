import type { ReactNode } from "react";

export const metadata = {
  title: "JAG Executive Workspace",
  description: "Executive morning brief, organizational intelligence, and JAG conversation workspace",
};

export default function JagLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-full">{children}</div>;
}
