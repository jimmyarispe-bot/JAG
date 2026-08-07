import Link from "next/link";

export type ListeningCrumb = {
  readonly label: string;
  readonly href?: string;
};

export function ListeningBreadcrumbs({
  items,
}: {
  readonly items: readonly ListeningCrumb[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-[var(--jag-muted)]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="hover:text-[var(--jag-text)]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={last ? "text-[var(--jag-text)]" : undefined}
                  aria-current={last ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
