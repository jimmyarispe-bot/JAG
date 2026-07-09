"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { cn } from "../utils";

interface ShellSearchProps {
  placeholder?: string;
  paramName?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export function ShellSearch({
  placeholder = "Search workspace…",
  paramName = "q",
  className,
  onSearch,
}: ShellSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get(paramName) ?? "");
  const [pending, startTransition] = useTransition();

  const submit = useCallback(
    (value: string) => {
      if (onSearch) {
        onSearch(value);
        return;
      }
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(paramName, value);
        else params.delete(paramName);
        router.push(`?${params.toString()}`);
      });
    },
    [onSearch, paramName, router, searchParams]
  );

  return (
    <form
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        submit(query);
      }}
    >
      <label htmlFor="wds-shell-search" className="sr-only">
        Search
      </label>
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      >
        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
      </svg>
      <input
        id="wds-shell-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        disabled={pending}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:w-64"
      />
    </form>
  );
}
