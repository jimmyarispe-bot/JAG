# AcademyOS Production Connector — B4.3

**Status:** Complete  
**Location:** `src/lib/platform/integrations/connectors/academyos/`  
**Contract:** Shared `Connector` via Integration Platform + Management  

## Principle

AcademyOS remains the operational system of record.  
JAG synchronizes, normalizes, validates, caches, and reasons — it does not replace SIS CRUD.

## Entities synchronized

Organizations, campuses, programs, students, guardians, employees, teachers, classes, enrollments, attendance, sessions, tuition, scholarships, payroll summaries, financial summaries, documents, tasks, communications.

## Normalization

Every accepted record includes:

- Internal JAG id (`jag_<type>_<hash>`)
- External AcademyOS id
- `sourceSystem: "academyos"`
- Sync timestamp
- Version
- Organization id
- Campus id (when applicable)

Canonical types map into JAG education / person / finance / ops / document namespaces.

## Intelligence mapping (no new domains)

`intelligence-feed.ts` produces soft lights for existing domains:

| Feed signal | Domains |
|-------------|---------|
| Workforce scores / counts | `human-capital` |
| Enrollment / students | `customer` |
| Attendance / classes / tasks | `operations` |
| Tuition / financial summary | `financial` |
| Composite | Organization Health / Wisdom soft inputs |
| Brief bullets + timeline | Executive Brief / Home timeline |

## ECC live labeling

When the AcademyOS store has synced data, widgets set `dataMode: "live"` for:

- Organization Health
- Workforce snapshot
- Enrollment / customer snapshot
- Financial snapshot (when summaries present)
- Executive Brief
- Organization timeline

## Client

`createDemoAcademyOsClient()` ships production-shaped SoR data for tests and ECC.  
Swap in a live HTTP/Supabase `AcademyOsClient` without changing the connector contract.

## Success criteria

Connect → authenticate → sync through Integration Management; ECC consumes live AcademyOS signals without modifying intelligence packages, the OIOS graph, registry, or public APIs.
