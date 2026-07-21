"use client";

import Link from "next/link";
import {
  forwardRef,
  useMemo,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/components/workspace-design-system/utils";
import {
  ACTION_CHIP_BASE,
  ACTION_CHIP_SIZE,
  ACTION_CHIP_VARIANT,
  inferActionChipVariant,
  type ActionChipSize,
  type ActionChipVariant,
} from "./action-chip-styles";
import {
  DEFAULT_ERROR_HINT,
  resolveActionLabels,
  type ActionLabelSet,
  type ActionStatus,
  type ActionVerb,
} from "./action-labels";

export type { ActionChipSize, ActionChipVariant };

type FeedbackProps = {
  /** Visual tone. Defaults from label via `inferActionChipVariant` when omitted. */
  variant?: ActionChipVariant;
  size?: ActionChipSize;
  /** Optional leading icon — never replaces the text label (idle only). */
  icon?: ReactNode;
  /**
   * UX-004 lifecycle. Prefer this over bare `loading`/`success` booleans.
   * Idle | Loading | Processing | Success | Error (+ Disabled via `disabled`).
   */
  status?: ActionStatus;
  /** Maps to loading when true (useTransition migrations). */
  pending?: boolean;
  /** Alias for pending — UX-004 / docs API. */
  loading?: boolean;
  /** When true and status unset, shows success flash chrome. */
  success?: boolean;
  verb?: ActionVerb;
  labels?: Partial<ActionLabelSet>;
  errorMessage?: string | null;
  errorHint?: string;
  /** Shown next to error; clicking retries (parent supplies handler). */
  onRetry?: () => void;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
};

export type ActionChipButtonProps = FeedbackProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className" | "disabled"> & {
    href?: undefined;
  };

export type ActionChipLinkProps = FeedbackProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className" | "href"> & {
    href: string;
  };

export type ActionChipProps = ActionChipButtonProps | ActionChipLinkProps;

const ERROR_TONE =
  "border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-50 focus-visible:ring-rose-400/40";

const SUCCESS_OVERRIDE: Partial<Record<ActionChipVariant, string>> = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-600",
  secondary: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50",
  outline: "border-emerald-300 bg-emerald-50 text-emerald-800",
  ghost: "bg-emerald-50 text-emerald-800",
  danger: "bg-emerald-600 text-white hover:bg-emerald-600",
  warning: "bg-emerald-600 text-white hover:bg-emerald-600",
  success: ACTION_CHIP_VARIANT.success,
  info: "bg-emerald-600 text-white hover:bg-emerald-600",
};

function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
      aria-hidden
    />
  );
}

function resolveStatus(
  status: ActionStatus | undefined,
  pending: boolean | undefined,
  loading: boolean | undefined,
  success: boolean | undefined
): ActionStatus {
  if (status) return status;
  if (pending || loading) return "loading";
  if (success) return "success";
  return "idle";
}

function resolveVariant(
  variant: ActionChipVariant | undefined,
  children: ReactNode,
  idleLabel: string
): ActionChipVariant {
  if (variant) return variant;
  if (typeof children === "string") return inferActionChipVariant(children);
  return inferActionChipVariant(idleLabel);
}

/**
 * UX-003 + UX-004 — unified CTA + action feedback control.
 *
 * Interaction states: Idle · Hover · Pressed · Loading · Success · Error · Disabled
 * Hover/Pressed via CSS; Loading/Success/Error via `status` / `pending` / `loading` / `success`.
 */
export const ActionChip = forwardRef<HTMLButtonElement | HTMLAnchorElement, ActionChipProps>(
  function ActionChip(props, ref) {
    const {
      variant: variantProp,
      size = "sm",
      icon,
      status: statusProp,
      pending,
      loading,
      success: successProp,
      verb = "custom",
      labels: labelOverrides,
      errorMessage,
      errorHint = DEFAULT_ERROR_HINT,
      onRetry,
      children,
      className,
      disabled,
      ...rest
    } = props;

    const labels = useMemo(
      () =>
        resolveActionLabels(verb, {
          ...labelOverrides,
          idle:
            labelOverrides?.idle ??
            (typeof children === "string" ? children : labelOverrides?.idle),
        }),
      [verb, labelOverrides, children]
    );

    const status = resolveStatus(statusProp, pending, loading, successProp);
    const busy = status === "loading" || status === "processing";
    const isDisabled = Boolean(disabled) || busy || status === "success";
    const variant = resolveVariant(variantProp, children, labels.idle);

    const label = (() => {
      if (children && (status === "idle" || status === "error")) return children;
      switch (status) {
        case "loading":
          return labels.loading;
        case "processing":
          return labels.processing;
        case "success":
          return labels.success;
        case "error":
          return children ?? `⚠ ${labels.error}`;
        case "idle":
        default:
          return children ?? labels.idle;
      }
    })();

    const toneClass =
      status === "error"
        ? ERROR_TONE
        : status === "success"
          ? (SUCCESS_OVERRIDE[variant] ?? ACTION_CHIP_VARIANT.success)
          : ACTION_CHIP_VARIANT[variant];

    const classes = cn(
      ACTION_CHIP_BASE,
      ACTION_CHIP_SIZE[size],
      toneClass,
      // Hover / pressed already in tokens; reinforce press feedback
      "hover:brightness-[0.98] active:brightness-95",
      busy && "pointer-events-none",
      className
    );

    const content = (
      <>
        {busy ? <Spinner /> : null}
        {status === "success" && !busy ? <span aria-hidden>✓</span> : null}
        {status === "error" && !busy ? <span aria-hidden>⚠</span> : null}
        {!busy && status === "idle" && icon ? (
          <span className="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5" aria-hidden>
            {icon}
          </span>
        ) : null}
        {/* Reserve width across idle/loading/success to avoid layout shift */}
        <span className="inline-grid justify-items-center">
          <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
            {labels.loading.length >= String(labels.idle).length ? labels.loading : labels.idle}
          </span>
          <span className="col-start-1 row-start-1 whitespace-nowrap">{label}</span>
        </span>
      </>
    );

    const live =
      busy || status === "success" || status === "error" ? (
        <span className="sr-only" aria-live={status === "error" ? "assertive" : "polite"}>
          {String(label)}
          {status === "error" && errorMessage ? `. ${errorMessage}` : ""}
        </span>
      ) : null;

    const errorBlock =
      status === "error" && (errorMessage || errorHint || onRetry) ? (
        <div className="flex max-w-xs flex-col items-start gap-1.5">
          {(errorMessage || errorHint) && (
            <p className="text-xs text-rose-700" role="alert">
              <span className="font-medium">{errorMessage ?? labels.error}.</span>
              {errorHint ? <span className="mt-0.5 block text-rose-600">{errorHint}</span> : null}
            </p>
          )}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className={cn(
                ACTION_CHIP_BASE,
                ACTION_CHIP_SIZE.xs,
                ACTION_CHIP_VARIANT.warning
              )}
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null;

    if ("href" in props && props.href) {
      const { href, ...anchorRest } = rest as ActionChipLinkProps;
      if (isDisabled || busy) {
        return (
          <div className="inline-flex flex-col items-start gap-1.5">
            <span
              className={cn(classes, "pointer-events-none opacity-60")}
              aria-disabled="true"
              aria-busy={busy || undefined}
              role="link"
              data-cta="action-chip"
              data-action-status={status}
              data-cta-variant={variant}
            >
              {content}
            </span>
            {live}
            {errorBlock}
          </div>
        );
      }
      const external = /^https?:\/\//i.test(href);
      const linkInner = (
        <>
          {content}
          {live}
        </>
      );
      return (
        <div className="inline-flex flex-col items-start gap-1.5">
          {external ? (
            <a
              href={href}
              ref={ref as React.Ref<HTMLAnchorElement>}
              className={classes}
              data-cta="action-chip"
              data-action-status={status}
              data-cta-variant={variant}
              target={anchorRest.target ?? "_blank"}
              rel={anchorRest.rel ?? "noopener noreferrer"}
              {...anchorRest}
            >
              {linkInner}
            </a>
          ) : (
            <Link
              href={href}
              ref={ref as React.Ref<HTMLAnchorElement>}
              className={classes}
              data-cta="action-chip"
              data-action-status={status}
              data-cta-variant={variant}
              {...anchorRest}
            >
              {linkInner}
            </Link>
          )}
          {errorBlock}
        </div>
      );
    }

    const { onClick, type = "button", ...buttonRest } = rest as ActionChipButtonProps;
    return (
      <div className="inline-flex flex-col items-start gap-1.5">
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type={type}
          disabled={isDisabled}
          aria-busy={busy || undefined}
          aria-disabled={isDisabled || undefined}
          data-cta="action-chip"
          data-action-status={status}
          data-cta-variant={variant}
          className={classes}
          onClick={(event) => {
            if (busy || status === "success") {
              event.preventDefault();
              return;
            }
            onClick?.(event);
          }}
          {...buttonRest}
        >
          {content}
        </button>
        {live}
        {errorBlock}
      </div>
    );
  }
);

/** Alias preferred in product / docs (UX-003). */
export const CTAButton = ActionChip;

/** Group of chips with consistent gap (tables, card footers). */
export function ActionChipGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} data-cta-group>
      {children}
    </div>
  );
}
