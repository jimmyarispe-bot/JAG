# 02 — Education Relationships

Canonical edges in `EDUCATION_RELATIONSHIP_CATALOG`.

Examples:

| Relationship | From → To |
|--------------|-----------|
| Student enrolled in Program | Student → Program |
| Teacher teaches Class | Teacher → Class |
| Family supports Student | Family → Student |
| Assessment measures Goal | Assessment → Goal |
| Intervention targets Student | Intervention → Student |
| Scholarship funds Enrollment | Scholarship → Enrollment |
| Class belongs to Course | Class → Course |
| Course belongs to Program | Course → Program |
| Session belongs to Class | Session → Class |
| Attendance Record for Session / Student | Attendance Record → Session / Student |
| Progress Record for Student | Progress Record → Student |
| Program offered at Campus | Program → Campus |
| Student has Goal | Student → Goal |

Endpoints must resolve to entity catalog ids (enforced by the validator).
