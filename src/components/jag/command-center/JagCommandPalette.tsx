"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  filterJagSearchCatalog,
  type JagSearchItem,
} from "@/lib/jag-command-center/search-filter";

export function JagCommandPalette({
  catalog,
}: {
  readonly catalog: readonly JagSearchItem[];
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [, startTransition] = useTransition();

  const results = useMemo(
    () => filterJagSearchCatalog(catalog, query),
    [catalog, query]
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
    dialogRef.current?.close();
  }, []);

  const openPalette = useCallback(() => {
    setOpen(true);
    dialogRef.current?.showModal();
    queueMicrotask(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialogRef.current?.open) close();
        else openPalette();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, openPalette]);

  function go(item: JagSearchItem) {
    close();
    startTransition(() => {
      router.push(item.href);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="hidden min-w-0 flex-1 items-center justify-between gap-2 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-1.5 text-left text-xs text-[var(--jag-muted)] outline-none hover:border-[var(--jag-border-strong)] focus-visible:border-[var(--jag-border-strong)] sm:flex"
        aria-keyshortcuts="Meta+K Control+K"
        aria-haspopup="dialog"
      >
        <span>Search decisions, briefings, orgs…</span>
        <kbd className="rounded border border-[var(--jag-border)] px-1.5 py-0.5 font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
          ⌘K
        </kbd>
      </button>
      <button
        type="button"
        onClick={openPalette}
        className="rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-xs text-[var(--jag-muted)] sm:hidden"
        aria-label="Open search"
        aria-keyshortcuts="Meta+K Control+K"
      >
        Search
      </button>

      <dialog
        ref={dialogRef}
        className="jag-command-palette w-[min(36rem,calc(100vw-2rem))] rounded-md border border-[var(--jag-border-strong)] bg-[var(--jag-panel)] p-0 text-[var(--jag-text)] shadow-2xl backdrop:bg-black/60"
        aria-label="Command Center search"
        onClose={close}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
      >
        <div className="border-b border-[var(--jag-border)] p-3">
          <label className="sr-only" htmlFor={listId}>
            Search Command Center
          </label>
          <input
            ref={inputRef}
            id={listId}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const item = results[active];
                if (item) go(item);
              } else if (e.key === "Escape") {
                e.preventDefault();
                close();
              }
            }}
            placeholder="Search decisions, briefings, organizations, packs…"
            className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-3 py-2 text-sm text-[var(--jag-text)] outline-none placeholder:text-[var(--jag-muted-2)] focus:border-[var(--jag-border-strong)]"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${listId}-results`}
            aria-autocomplete="list"
          />
        </div>
        <ul
          id={`${listId}-results`}
          role="listbox"
          className="max-h-[min(24rem,50vh)] overflow-y-auto p-2"
        >
          {results.length === 0 ? (
            <li className="px-2 py-4 text-sm text-[var(--jag-muted)]">
              No matches.
            </li>
          ) : (
            results.map((item, index) => (
              <li key={item.id} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  className={`flex w-full flex-col rounded px-3 py-2 text-left ${
                    index === active
                      ? "bg-[var(--jag-panel-2)]"
                      : "hover:bg-[var(--jag-panel-2)]"
                  }`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(item)}
                >
                  <span className="text-sm text-[var(--jag-text)]">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-[var(--jag-muted)]">
                    {item.kind.replace(/_/g, " ")} · {item.subtitle}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </dialog>
    </>
  );
}
