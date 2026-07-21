# Platform Bulk Import Engine

Reusable platform service for bulk data imports. Students are the first registered entity; parents, employees, classes, scholarships, schools, programs, vendors, and donors can be added via `registerImporter(...)`.

## Location

```
src/lib/platform/imports/
  engine/          Orchestration (upload → map → validate → preview → commit)
  parsers/         CSV, Excel (.xlsx/.xls), Google Sheets export
  validation/      Required fields, dates, duplicates, entity rules
  mapping/         Auto + manual column mapping
  preview/         Preview table model + highlights
  jobs/            Job / row / transaction persistence
  templates/       Downloadable CSV templates
  history/         Import history + report CSV
  rollback/        Full-import transaction rollback
  entities/student Family + scholarship intelligence + commit
  types.ts
  registry.ts
  service.ts
  access.ts
  actions.ts
  README.md
```

## Registering a future importer

```ts
import { registerImporter } from "@/lib/platform/imports";

registerImporter({
  entityType: "employee",
  displayName: "Employees",
  description: "HR roster import",
  fields: [/* ... */],
  templates: [/* ... */],
  validateRow(mapped, ctx, destination, rowNumber) { /* ... */ return []; },
  resolvePreviewAction(mapped, ctx, destination) {
    return { action: "create", highlight: "new" };
  },
  async commitRow(mapped, destination, action, targetEntityId, helpers) {
    // write entity + return related ids for rollback
    return { ok: true, action: "imported", entityType: "employee", entityId: "..." };
  },
});
```

Student bootstrap lives in `bootstrap.ts` and runs when the module is imported.

## Student wizard

Route: `/dashboard/students/import`

Steps:

1. Upload (drag & drop / browse)
2. Destination (school, campus, program, school year, import mode)
3. Automatic + manual column mapping
4. Validation (+ error report download)
5. Preview (new / updated / duplicate / skipped highlights)
6. Import progress
7. Results (+ import report)

## Security

Allowed roles: **CEO**, **FOUNDER**, **Executive Director**, **School Leader**, **Admissions** — each must also have `students.edit`.

School Leaders may only import into schools returned by `canAccessSchool`.

## Persistence

Migration: `supabase/migrations/187_platform_bulk_import_engine.sql`

| Table | Purpose |
|-------|---------|
| `platform_import_jobs` | Job metadata, counts, mappings, duration |
| `platform_import_rows` | Staged raw/mapped rows + issues |
| `platform_import_transactions` | Created/updated entity ids for rollback |

## Public API

Prefer `ImportService` from `@/lib/platform/imports`:

- `upload` / `configureDestination` / `mapColumns` / `validate` / `preview` / `commit`
- `history` / `rollback` / `listTemplates` / `downloadTemplateCsv`

Server actions for the wizard: `@/lib/platform/imports/actions`.

## Family & scholarship intelligence

- Sibling grouping by shared parent email, phone, or address
- Existing parent/guardian email → link student to family; otherwise create family + guardian
- Scholarship labels recognize Florida/Georgia programs, Private Pay, Grant, ESA, Contract, and catalog funding codes; unknown values warn without blocking

## Notes

- Does **not** replace the Enterprise Data Platform import center (`/dashboard/data/import`).
- Apply migration `187` before using the wizard against a live database.
