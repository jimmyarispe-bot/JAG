import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

type ExecutiveAccessEmptyProps = {
  reason: "access" | "school";
};

/**
 * Production gate for EDI pages — never render a blank screen.
 */
export function ExecutiveAccessEmpty({ reason }: ExecutiveAccessEmptyProps) {
  if (reason === "access") {
    return (
      <EmptyState
        title="Executive Intelligence access required"
        description="You need executive intelligence permissions to view this workspace."
        action={
          <Link
            href="/dashboard"
            className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Back to dashboard
          </Link>
        }
      />
    );
  }

  return (
    <EmptyState
      title="No school context"
      description="Assign a primary school to your account to load executive intelligence for that campus."
      action={
        <Link
          href="/dashboard/admin/organization"
          className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Open organization settings
        </Link>
      }
    />
  );
}
