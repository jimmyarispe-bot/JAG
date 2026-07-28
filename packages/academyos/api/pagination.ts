/** Pack-local pagination helpers (mirrors platform helpers without core edits). */

export type PageInput = { readonly page: number; readonly pageSize: number };

export function parsePage(searchParams: URLSearchParams): PageInput {
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const raw = Number(searchParams.get("pageSize") ?? "25") || 25;
  const pageSize = Math.min(100, Math.max(1, raw));
  return { page, pageSize };
}

export function paginate<T>(
  items: readonly T[],
  pagination: PageInput
): {
  items: readonly T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
} {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
  const page = Math.min(pagination.page, totalPages);
  const start = (page - 1) * pagination.pageSize;
  return {
    items: items.slice(start, start + pagination.pageSize),
    page,
    pageSize: pagination.pageSize,
    total,
    totalPages,
  };
}
