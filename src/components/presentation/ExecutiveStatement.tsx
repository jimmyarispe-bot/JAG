import type { ReactNode } from "react";
import { STATEMENT_CLASS, TEMPLATE_STATEMENT_MT } from "./tokens";

interface ExecutiveStatementProps {
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}

export function ExecutiveStatement({ children, className = "", bordered = false }: ExecutiveStatementProps) {
  return (
    <blockquote
      className={`${TEMPLATE_STATEMENT_MT} max-w-4xl text-center ${STATEMENT_CLASS} ${
        bordered ? "max-w-2xl border-t border-slate-100 pt-12" : ""
      } ${className}`.trim()}
    >
      {children}
    </blockquote>
  );
}
