"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { cn } from "@/components/workspace-design-system/utils";

type Props = {
  children: ReactNode;
  title?: string;
  className?: string;
  fallback?: ReactNode;
};

type State = {
  error: Error | null;
};

/** Isolates widget failures so the rest of the page stays usable. */
export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[WidgetBoundary]", error, info.componentStack);
    }
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className={cn(
            "rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800",
            this.props.className
          )}
          role="alert"
        >
          <p className="font-medium">{this.props.title ?? "Unable to load this section"}</p>
          <p className="mt-1">
            {this.state.error.message ||
              "Something went wrong. Other sections remain available."}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
