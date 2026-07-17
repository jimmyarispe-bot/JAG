# Updated UX Guidelines — Post D.1

1. **Authorization UI** — Permission-gated; never invent SpEd/nav for unbuilt products.  
2. **Forms** — Use `FormField` + `ErrorBanner`/`SuccessBanner`; announce via `useAnnounce`.  
3. **Dialogs** — Use `ConfirmDialog` (focus trapped).  
4. **Empty states** — Import from `@/components/ui/EmptyState` (or XES re-export).  
5. **Loading** — Prefer route `loading.tsx` + `RouteLoadingSkeleton` with `aria-busy`.  
6. **Charts** — Provide SR summary/table for non-text visualizations.  
7. **Motion** — Rely on global `prefers-reduced-motion`; portal toggle remains additive.  
8. **Copy** — Do not claim i18n/AA/features that are not shipped.  
9. **Exec IA** — `/exec` = Command Center; `/dashboard/executive` = Executive Intelligence.  
10. **Focus** — Interactive controls must show `:focus-visible` rings.
