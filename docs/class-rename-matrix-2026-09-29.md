# Class rename matrix — 29 September 2026

Type the current JAG name into the last column of each row, then send this
back. Where a class does not exist yet, write NEW. Where you want it left
alone, write LEAVE.

Nothing is deleted. Every course keeps its row and its id, so its sections,
its scheduled classes, its enrolled children and its lesson plans stay
attached. Only the name and the description change.

---

## Virtual / GA / FL

| New name | Covers | REPLACES (type here) |
|---|---|---|
| Lit Lab | Reading, writing, grammar; novel studies; Language LIVE! for middle | |
| Digit Lab | Zearn; arithmetic, fractions, geometry, financial literacy | |
| Earthology | Earth + physical science, geography, history, culture | |
| Structured Literacy | Wilson Reading System®, Certified Dyslexia Practitioners | |

## The Academy HS

| New name | Covers | REPLACES (type here) |
|---|---|---|
| Life Lab | Financial literacy, career readiness, independent living | |
| Earth Quest | Science, geography, history, cultures, leaders | |
| Real World Math | Algebra, financial literacy, statistics, practical geometry | |
| Entrepreneurship | Market research, branding, pitching a business plan | |

---

## Names already in the JAG that are NOT in your two documents

These exist today (19 September schedule work). Say what happens to each.

| Currently called | What to do (type here) |
|---|---|
| Earth Lab (I / II) | |
| Tutoring | |
| SL Tutoring (a section of Tutoring) | |
| HS Real World Math (separate from Real World Math) | |
| Life Lab I / II | |
| Entrepreneurship I / II / Advanced | |

---

## Four questions

**1. Where does the word "foundational" appear for The Academy HS?**
(course name / a heading on a screen / inside a description / not sure)

>

**2. Should SECTION names take the new names too?**
A teacher's timesheet shows things like `VEDDER-1300 DigitLab`. Your call on
19 September was that Lit Lab's age bands and Digit Lab's variants are
sections, not courses.
(yes, rename sections too / no, courses only)

>

**3. The hyphen.** Migration 451 writes the HS inquiry option as
"Tutoring - HS Real-World Math". Your document says "Real World Math".
(match them / leave as they are)

>

**4. Do these four Virtual/GA/FL classes exist at all three campuses,**
or only some? A campus that does not run a class should not have a row for it.

>

---

## Why this is a rename and not a delete-and-recreate

`courses` cascades on delete. Removing the rows would take with them:

- 42 `course_sections`
- ~2,137 scheduled `instructional_sessions`
- every `student_enrollment` — all 64 children
- teacher lesson plans, artifacts and progress records
- `class_pay_rates`, which join courses BY NAME (migration 376)

Postgres would do all of that without a warning, because cascade is doing what
it was told. Renaming touches none of it.
