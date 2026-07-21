import { Suspense, type ReactNode } from "react";
import { FadeIn } from "./FadeIn";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";

export type WidgetBoundaryProps = {
  children: ReactNode;
  /** Shown while the widget’s async data is pending (skeleton stage). */
  skeleton?: ReactNode;
  /** Optional label for the loading/busy region. */
  label?: string;
  /** Inline error title when this widget fails. */
  errorTitle?: string;
  className?: string;
  /** Custom error UI for this widget. */
  errorFallback?: ReactNode;
};

/**
 * Progressive widget wrapper (UX-002):
 * Skeleton → resolved content fades in.
 * Errors stay inline and do not fail the page.
 *
 * Server Component shell so Suspense can stream RSC payloads.
 */
export function WidgetBoundary({
  children,
  skeleton,
  label,
  errorTitle,
  className,
  errorFallback,
}: WidgetBoundaryProps) {
  return (
    <div className={className} data-xes-widget={label || undefined}>
      <WidgetErrorBoundary title={errorTitle ?? label} fallback={errorFallback}>
        <Suspense fallback={skeleton}>
          <FadeIn>{children}</FadeIn>
        </Suspense>
      </WidgetErrorBoundary>
    </div>
  );
}
