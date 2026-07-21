import Link from "next/link";
import { crudBtn } from "./button-styles";

interface EntityHistoryLinkProps {
  href: string;
  label?: string;
  className?: string;
}

/** Consistent History / Audit entry point for profiles and detail pages. */
export function EntityHistoryLink({
  href,
  label = "History",
  className,
}: EntityHistoryLinkProps) {
  return (
    <Link
      href={href}
      className={className ?? crudBtn.secondary}
      aria-label={`${label} — timeline and audit`}
    >
      {label}
    </Link>
  );
}
