import type { Metadata } from "next";
import { MarketingShell } from "@/components/jag-marketing/MarketingShell";

export const metadata: Metadata = {
  title: "The JAG™ — Organizational Intelligence Operating System",
  description:
    "The JAG™ is the executive operating system that launches and manages products like AcademyOS.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingShell>{children}</MarketingShell>;
}
