# 04 — Form Library

Forms are registered with the **platform Forms Framework**. No UI redesign in this sprint.

Source: `src/applications/academyos/forms/definitions.ts`  
Prior catalog: `docs/applications/academyos/08_FORMS_CATALOG.md`

---

## A. Registered create forms

| Form id | Entity | Domain |
|---------|--------|--------|
| `academyos.student.create` | Student | SIS |
| `academyos.guardian.create` | Guardian | SIS |
| `academyos.emergency-contact.create` | EmergencyContact | SIS |
| `academyos.teacher.create` | Teacher | Workforce |
| `academyos.employee.create` | Employee | Workforce |
| `academyos.school.create` | School | Org / SIS |
| `academyos.program.create` | Program | Academics |
| `academyos.course.create` | Course | Academics |
| `academyos.section.create` | Section | Academics |
| `academyos.class.create` | Class | Academics |
| `academyos.enrollment.create` | Enrollment | Admissions/SIS |
| `academyos.attendance.create` | AttendanceRecord | Attendance |
| `academyos.assessment.create` | Assessment | Learning |
| `academyos.inquiry.create` | Inquiry | Admissions |
| `academyos.application.create` | Application | Admissions |
| `academyos.behavior-incident.create` | BehaviorIncident | Behavior |
| `academyos.iep.create` | IEP | SPED |
| `academyos.plan504.create` | Plan504 | SPED |
| `academyos.medical-record.create` | MedicalRecord | Health |
| `academyos.medication-authorization.create` | MedicationAuthorization | Health |
| `academyos.transportation-route.create` | TransportationRoute | Ops |
| `academyos.scholarship.create` | Scholarship | Finance/Aid |
| `academyos.invoice.create` | Invoice | Finance (edu) |
| `academyos.payment.create` | Payment | Finance (edu) |
| `academyos.payroll-batch.create` | PayrollBatch | Workforce |
| `academyos.calendar-event.create` | CalendarEvent | Calendar |
| `academyos.announcement.create` | Announcement | Communications |
| `academyos.document.create` | Document | → Knowledge |
| `academyos.message.create` | Message | Communications |

---

## B. Public / portal form experiences (UI, not always form-ids)

| Experience | Location | Backing |
|------------|----------|---------|
| Interest / inquiry | Apply + admissions | `inquiry.create` |
| Application | `/apply/**` | `application.create` |
| Enrollment packet fields | Admissions portal | Enrollment + Knowledge uploads |
| Parent portal forms | `/portal/forms` | Forms Framework |
| Scholarship application | Scholarships UI | `scholarship.create` + workflow |
| Document upload | Portal/dashboard documents | KnowledgeEngine upload |
| Signature acknowledgement | Workflows | Workflow `acknowledgement` / `signature_hook` |

---

## C. Consolidation rules

1. New education entities → register Forms Framework definitions (do not invent ad-hoc form engines).  
2. Document-shaped payloads → **KnowledgeEngine** document types + metadata (P-014 presets include IEP, 504, invoices, etc.).  
3. Financial create (GL/bills/journals) → Finance/Revenue/Payables APIs — not `academyos.invoice` as a second ledger.  
4. Pedagogy assessments → Learning Intelligence (P-015) item models; forms remain UX entry points.
