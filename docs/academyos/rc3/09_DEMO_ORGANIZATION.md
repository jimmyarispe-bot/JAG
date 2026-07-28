# AcademyOS RC-3 — Demo Organization

## Purpose

`seedDemoOrganization()` creates an in-pack demonstration organization that exercises major AcademyOS workflows without writing to production databases.

## Includes

Organization (via pack install), campuses, administrators, teachers, students, parents, classes, enrollments, tuition invoices, employees, admissions applicants, attendance, notifications.

## How to run

```ts
import { seedDemoOrganization, buildOperationsDashboard } from "@academyos";

seedDemoOrganization({ organizationId: "org.demo" });
// or via dashboard
buildOperationsDashboard({ seedDemo: true, registerWithStudio: true });
```

## Note

This seed uses AcademyOS pack stores and Platform SDK install lifecycle. It is not a Supabase SQL seed.
