/**
 * "I want to work on…"
 *
 * Somebody signs in and is looking at nineteen sidebar entries and a board with
 * three hundred families on it. They know what they came to do. They do not
 * necessarily know which of the nineteen doors leads to it.
 *
 * So: they say what they want to do, and get the steps — each a real link to a
 * real page, ticked off as they go, in a panel that stays while they work.
 *
 * WHY A CHECKLIST AND NOT A HIGHLIGHTED TOUR
 *
 * A guided overlay that dims the screen and points at a specific button is
 * pinned to a CSS selector. Any layout change silently breaks it, and nobody
 * discovers that until a school leader is standing in front of a parent. A
 * checklist points at PAGES, a far more stable contract than pixels — and when
 * a page does move, the link 404s loudly instead of a highlight quietly landing
 * on nothing.
 *
 * THE AREAS ARE THE SIDEBAR
 *
 * Deliberately. Somebody told "it's under Admissions" should find an area
 * called Admissions, in the order they already see. Inventing a second taxonomy
 * for the same product is how you end up explaining the explanation.
 *
 * EVERY href IS A PAGE THAT EXISTS
 *
 * Checked against src/app, and `guides-exist.test.ts` asserts it against the
 * filesystem so it stays true. A guide that sends somebody to a 404 is worse
 * than no guide: it costs the least-confident user the trust to try the next
 * one, and those are exactly who this is for.
 *
 * THERE IS ANOTHER WALKTHROUGH ENGINE IN THIS CODEBASE
 *
 * Migration 216 built one — highlight targets, a content catalog, per-user
 * progress tables. Nothing under src/app mounts it, and every walkthrough in it
 * is about the JAG command centre rather than the work these people do. Merging
 * the two is a real decision and is not made here.
 *
 * Client-safe: no server imports.
 */

export interface GuideStep {
  /** What they are doing. Imperative, plain, no trailing full stop. */
  readonly title: string;
  /** Why, or what to watch for. One sentence, or omitted. */
  readonly detail?: string;
  /**
   * Where to go. Omitted when the step happens on the page they are already on
   * — sending somebody to a page they are looking at is noise.
   */
  readonly href?: string;
}

export interface Guide {
  readonly id: string;
  readonly title: string;
  /** One line, shown under the title in the chooser. */
  readonly summary: string;
  readonly steps: readonly GuideStep[];
}

export interface GuideArea {
  readonly id: string;
  readonly label: string;
  /** What this area is, for somebody unsure whether they want it. */
  readonly blurb: string;
  readonly guides: readonly Guide[];
}

export const GUIDE_AREAS: readonly GuideArea[] = [
  // ───────────────────────────────────────────────────────────── Admissions
  {
    id: "admissions",
    label: "Admissions",
    blurb: "Inquiries, tours and shadow days, applications, and the accept or decline decision.",
    guides: [
      {
        id: "admissions.who-is-waiting",
        title: "Find out who is waiting on us",
        summary: "The families nobody has come back to, longest wait first.",
        steps: [
          {
            title: "Open Waiting on us",
            detail: "Every open task across the network, oldest first.",
            href: "/dashboard/admissions/waiting",
          },
          {
            title: "Pick your campus from the tabs",
            detail: "The tab is in the address, so you can bookmark your own list.",
          },
          {
            title: "Start at the top",
            detail:
              "The longest wait is the family most likely to have already chosen another school.",
          },
          {
            title: "Call or email from the row",
            detail: "The phone number and address are links — no need to open the case first.",
          },
          {
            title: "Open the case and write down what happened",
            detail: "A call nobody recorded is a call that gets made twice.",
          },
        ],
      },
      {
        id: "admissions.narrow-the-board",
        title: "Find your own families on the board",
        summary: "Three hundred cards down to the ones that are yours.",
        steps: [
          { title: "Open the pipeline board", href: "/dashboard/admissions?view=pipeline" },
          {
            title: "Set Campus to yours",
            detail: "The number beside each choice is how many families it would leave.",
          },
          {
            title: "Set Waiting to 30+ days",
            detail: "That is your call list — the families left longest.",
          },
          {
            title: "Copy the address out of the bar",
            detail: "The filters are in the URL, so you can bookmark it or send it to somebody.",
          },
        ],
      },
      {
        id: "admissions.book-a-shadow-day",
        title: "Book a shadow day, tour or interview",
        summary: "Get the appointment onto the calendar AND into JAG.",
        steps: [
          { title: "Open the pipeline board", href: "/dashboard/admissions?view=pipeline" },
          { title: "Find the family", detail: "Use the campus filter to narrow it down." },
          {
            title: "Change their stage to Tour, Interview or Shadow Days Scheduled",
            detail: "A date box opens — the stage will not move until you fill it in.",
          },
          {
            title: "Put in the date and time the family chose",
            detail:
              "If they booked through the Google link themselves, type the slot they picked. That is what puts it into JAG at all.",
          },
          {
            title: "Check the readback line before you confirm",
            detail: "It spells the booking out in words, so a mistyped hour cannot slip past.",
          },
        ],
      },
      {
        id: "admissions.answer-a-decision",
        title: "Answer a decision waiting on you",
        summary: "Invite to apply, invite to shadow days, or accept and decline.",
        steps: [
          {
            title: "Open Decisions",
            detail: "Everything waiting on a person rather than on the system.",
            href: "/dashboard/admissions/decisions",
          },
          {
            title: "Read the family's application first",
            detail:
              "What a family says about their child's greatness and challenges is why they told you.",
          },
          {
            title: "Answer the question",
            detail: "The consequence of each answer is written under it before you choose.",
          },
          {
            title: "Add a note if the answer needs explaining",
            detail: "Your answer is recorded against your name.",
          },
        ],
      },
      {
        id: "admissions.shadow-days-done",
        title: "Say a shadow day is finished",
        summary: "What opens the accept-or-deny decision.",
        steps: [
          { title: "Open Shadow days", href: "/dashboard/admissions/shadow-days" },
          { title: "Find the child whose days are complete" },
          {
            title: "Mark them complete",
            detail:
              "Nothing else moves them. JAG cannot see the calendar, so a person has to say it happened.",
          },
          {
            title: "Go and answer the decision it opened",
            href: "/dashboard/admissions/decisions",
          },
        ],
      },
      {
        id: "admissions.add-a-lead",
        title: "Add a family who called or walked in",
        summary: "An inquiry that did not come through the website.",
        steps: [
          { title: "Open New lead", href: "/dashboard/admissions/leads/new" },
          {
            title: "Choose the campus first",
            detail: "It decides which application and which booking link they get.",
          },
          {
            title: "Put in the parent's email carefully",
            detail:
              "It is how every later message reaches them. JAG suggests a correction if it looks like a typo.",
          },
          { title: "Save, then find them on the board", href: "/dashboard/admissions?view=pipeline" },
        ],
      },
      {
        id: "admissions.import",
        title: "Bring in a list of leads",
        summary: "A spreadsheet or an export from somewhere else.",
        steps: [
          { title: "Open Bulk import", href: "/dashboard/admissions/import" },
          {
            title: "Match your columns to JAG's",
            detail: "Parent email is the one that matters — it is how duplicates are caught.",
          },
          {
            title: "Import, then check the board",
            detail: "Imported families get their follow-up task automatically.",
            href: "/dashboard/admissions?view=pipeline",
          },
        ],
      },
      {
        id: "admissions.checklist",
        title: "See what a family still has to give us",
        summary: "Documents and steps outstanding on an application.",
        steps: [
          { title: "Open the admissions checklist", href: "/dashboard/admissions/checklist" },
          { title: "Find the family" },
          {
            title: "Chase what is outstanding",
            detail: "Ask for everything missing in one message rather than three.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────── Student Success
  {
    id: "students",
    label: "Student Success",
    blurb: "A child's record — grades, schedule, medical, documents, and what is missing.",
    guides: [
      {
        id: "students.find-and-fix",
        title: "Find a student and fix their record",
        summary: "Open a child and fill in what is missing.",
        steps: [
          { title: "Open Student Success", href: "/dashboard/students" },
          { title: "Filter to the child", detail: "Campus, grade, program — each column filters." },
          { title: "Open their profile" },
          {
            title: "Look at what is flagged incomplete",
            detail:
              "Missing date of birth and grade level matter most — they drive placement and state reporting.",
          },
          {
            title: "Fill in what you know, leave blank what you do not",
            detail: "A guessed date of birth is worse than an empty one, because nobody asks again.",
          },
        ],
      },
      {
        id: "students.import",
        title: "Bring in a list of students",
        summary: "A roster from a spreadsheet.",
        steps: [
          { title: "Open Student import", href: "/dashboard/students/import" },
          { title: "Match your columns" },
          {
            title: "Check the result against the roster",
            detail: "Any row that did not import says why.",
            href: "/dashboard/students",
          },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── Families
  {
    id: "families",
    label: "Families",
    blurb: "Parents and guardians — who to contact, and how.",
    guides: [
      {
        id: "families.contact-details",
        title: "Update a family's contact details",
        summary: "Change the address, phone or email a school reaches them on.",
        steps: [
          { title: "Open Families", href: "/dashboard/families" },
          { title: "Find the family and open them" },
          {
            title: "Update the details",
            detail: "The email address is what every automated message uses. Check it twice.",
          },
          {
            title: "Check the children attached to them",
            detail: "A family with a child at two campuses should show both.",
          },
        ],
      },
      {
        id: "families.everyone",
        title: "See everyone in the network",
        summary: "Every student, parent and contact in one table.",
        steps: [
          { title: "Open the People directory", href: "/dashboard/people" },
          {
            title: "Use the filter row under the headings",
            detail:
              "Every column filters. Combine them — campus plus grade plus program narrows fast.",
          },
          {
            title: "Use the group chips for a whole category",
            detail: "Students, parents, staff — the number on each chip is the count.",
          },
          { title: "Export CSV if you need it outside JAG" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────── Communications
  {
    id: "communications",
    label: "Communications",
    blurb: "What JAG sends families, when, and what it has already sent.",
    guides: [
      {
        id: "communications.what-went-out",
        title: "Check what a family has been sent",
        summary: "Before you call, know what they already received.",
        steps: [
          { title: "Open Communications", href: "/dashboard/communications" },
          { title: "Find the family" },
          {
            title: "Read the timeline",
            detail: "What was sent and when — so you do not repeat it on the phone.",
          },
        ],
      },
      {
        id: "communications.write-one",
        title: "Send a message to a family",
        summary: "A one-off email, not an automated one.",
        steps: [
          { title: "Open Compose", href: "/dashboard/communications/compose" },
          { title: "Choose who it goes to" },
          {
            title: "Write it and send",
            detail: "It is recorded on their timeline, so the next person knows it happened.",
          },
        ],
      },
      {
        id: "communications.announcement",
        title: "Tell everybody something",
        summary: "An announcement rather than a single message.",
        steps: [
          { title: "Open Announcements", href: "/dashboard/communications/announcements" },
          {
            title: "Choose the audience",
            detail: "A campus, a grade, or the whole network. Read it back before you send.",
          },
          { title: "Send it" },
        ],
      },
      {
        id: "communications.templates",
        title: "Change the wording JAG sends automatically",
        summary: "The letters that go out without anybody clicking send.",
        steps: [
          { title: "Open Templates", href: "/dashboard/communications/templates" },
          { title: "Find the template by what it is for" },
          {
            title: "Edit the wording",
            detail:
              "Leave the {{tokens}} alone unless you know the field exists — an unknown one is mailed to a parent as literal braces.",
          },
          { title: "Save, and check it on a real family's timeline afterwards" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────── Scheduling
  {
    id: "scheduling",
    label: "Scheduling",
    blurb: "Class schedules and who is in them.",
    guides: [
      {
        id: "scheduling.look",
        title: "Look at or change a schedule",
        summary: "Who is in which class, when.",
        steps: [
          { title: "Open Scheduling", href: "/dashboard/scheduling" },
          { title: "Choose the campus and the term" },
          {
            title: "Check a student's own schedule too",
            detail: "It is the version a parent sees.",
            href: "/dashboard/students",
          },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── Calendar
  {
    id: "calendar",
    label: "Calendar",
    blurb: "Dates families and staff both see.",
    guides: [
      {
        id: "calendar.add",
        title: "Put something on the school calendar",
        summary: "A holiday, an event, a closure.",
        steps: [
          { title: "Open Calendar", href: "/dashboard/calendar" },
          { title: "Add the event" },
          {
            title: "Check who it is visible to",
            detail: "A staff-only date showing to parents causes more calls than it saves.",
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────── Teacher Studio
  {
    id: "teacher",
    label: "Teacher Studio",
    blurb: "Attendance, classes, lessons, progress and timesheets.",
    guides: [
      {
        id: "teacher.attendance",
        title: "Take attendance for today",
        summary: "The daily register for your class.",
        steps: [
          { title: "Open Attendance", href: "/dashboard/teacher/attendance" },
          { title: "Choose the class and the date" },
          {
            title: "Mark each student",
            detail: "Absent needs a reason where you have one — it is what a parent will ask about.",
          },
          { title: "Save before you leave the page" },
        ],
      },
      {
        id: "teacher.classes",
        title: "See your classes and who is in them",
        summary: "Your roster, class by class.",
        steps: [
          { title: "Open Classes", href: "/dashboard/teacher/classes" },
          { title: "Open a class" },
          {
            title: "Open a student from the roster",
            detail: "Their whole record, from your side of it.",
          },
        ],
      },
      {
        id: "teacher.progress",
        title: "Record how a student is doing",
        summary: "Progress against what they are working on.",
        steps: [
          { title: "Open Progress", href: "/dashboard/teacher/progress" },
          { title: "Choose the student" },
          {
            title: "Record where they are",
            detail: "This is what a parent sees and what a school leader reads before a decision.",
          },
        ],
      },
      {
        id: "teacher.lessons",
        title: "Plan or record a lesson",
        summary: "What you are teaching, and what happened.",
        steps: [
          { title: "Open Lessons", href: "/dashboard/teacher/lessons" },
          { title: "Choose the class and the date" },
          { title: "Write the plan or the record" },
        ],
      },
      {
        id: "teacher.timesheets",
        title: "Fill in your timesheet",
        summary: "Hours worked, for payroll.",
        steps: [
          { title: "Open Timesheets", href: "/dashboard/teacher/timesheets" },
          { title: "Enter the hours for the period" },
          {
            title: "Submit before the deadline",
            detail: "A late timesheet moves to the next payroll run, not this one.",
          },
        ],
      },
      {
        id: "teacher.documents",
        title: "Find or add a class document",
        summary: "Resources and records for your own classes.",
        steps: [
          { title: "Open your documents", href: "/dashboard/teacher/documents" },
          { title: "Search or upload" },
          { title: "Attach it to the right class so somebody else can find it" },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────── School Leader
  {
    id: "school-leader",
    label: "School Leader",
    blurb: "Your campus — enrollment, students, teachers, academics and compliance.",
    guides: [
      {
        id: "school-leader.morning",
        title: "See how your campus is doing",
        summary: "Where to start on a normal morning.",
        steps: [
          { title: "Open School Leader", href: "/dashboard/school-leader" },
          {
            title: "Check enrollment",
            detail: "Who is joining, who is leaving, how many seats are left.",
            href: "/dashboard/school-leader/enrollment",
          },
          {
            title: "Check who is waiting on you in admissions",
            href: "/dashboard/admissions/waiting",
          },
          {
            title: "Check the decisions queue",
            detail: "These are the ones only you can answer.",
            href: "/dashboard/admissions/decisions",
          },
        ],
      },
      {
        id: "school-leader.students",
        title: "Look at your students",
        summary: "Your campus only, not the whole network.",
        steps: [
          { title: "Open your students", href: "/dashboard/school-leader/students" },
          { title: "Filter to what you are looking for" },
          { title: "Open a child to see their whole record" },
        ],
      },
      {
        id: "school-leader.teachers",
        title: "Look at your teachers",
        summary: "Who is teaching what.",
        steps: [
          { title: "Open your teachers", href: "/dashboard/school-leader/teachers" },
          { title: "Open a teacher" },
          {
            title: "Check their classes and progress records",
            href: "/dashboard/school-leader/academics",
          },
        ],
      },
      {
        id: "school-leader.compliance",
        title: "Check what compliance needs",
        summary: "What is due, and what is missing.",
        steps: [
          { title: "Open Compliance", href: "/dashboard/school-leader/compliance" },
          { title: "Read what is outstanding" },
          { title: "Chase the missing documents", href: "/dashboard/documents" },
        ],
      },
      {
        id: "school-leader.scheduling",
        title: "Look at your campus schedule",
        summary: "Classes and staffing for your school.",
        steps: [
          { title: "Open your scheduling", href: "/dashboard/school-leader/scheduling" },
          { title: "Choose the term" },
          { title: "Check every class has a teacher" },
        ],
      },
      {
        id: "school-leader.reports",
        title: "Get a report for your campus",
        summary: "Numbers you can send on.",
        steps: [
          { title: "Open Reports", href: "/dashboard/school-leader/reports" },
          { title: "Choose the report and the period" },
          { title: "Read the figures before you send them anywhere" },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────── Documents
  {
    id: "documents",
    label: "Documents",
    blurb: "Files attached to students, families and compliance.",
    guides: [
      {
        id: "documents.find",
        title: "Find or upload a document",
        summary: "A record, a form, a signed agreement.",
        steps: [
          { title: "Open Documents", href: "/dashboard/documents" },
          { title: "Search or filter to what you need" },
          {
            title: "Upload against the right student or family",
            detail: "A file attached to nobody is a file nobody finds again.",
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────── Workflows
  {
    id: "workflows",
    label: "Workflows",
    blurb: "What JAG does on its own, and what it has already done.",
    guides: [
      {
        id: "workflows.see",
        title: "See what JAG is doing automatically",
        summary: "Before you assume nothing happened.",
        steps: [
          { title: "Open Workflows", href: "/dashboard/workflows" },
          { title: "Open one to read what it does" },
          {
            title: "Check the history",
            detail: "What actually ran, and what failed.",
            href: "/dashboard/workflows/history",
          },
        ],
      },
      {
        id: "workflows.automation-gate",
        title: "Check whether automation is on for a family",
        summary: "Whether JAG is allowed to email them without being asked.",
        steps: [
          { title: "Open the Automation dashboard", href: "/dashboard/admissions/automation" },
          {
            title: "Read which families have it started",
            detail: "Automation off means every message is one a person chose to send.",
          },
          {
            title: "Do not switch it on for everybody",
            detail:
              "It is per family on purpose. Turning it on network-wide sends a backlog of messages nobody reviewed.",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────── Scholarships
  {
    id: "scholarships",
    label: "Scholarships",
    blurb: "State funding and scholarship awards.",
    guides: [
      {
        id: "scholarships.check",
        title: "Check a student's funding",
        summary: "Who is paying, and how much.",
        steps: [
          { title: "Open Scholarships", href: "/dashboard/scholarships" },
          { title: "Find the student" },
          {
            title: "Check the award against what is being billed",
            detail: "A gap here is money that either never arrives or gets charged twice.",
            href: "/dashboard/finance/schedules",
          },
        ],
      },
      {
        id: "scholarships.state-funding",
        title: "Work through state funding in admissions",
        summary: "What a family applied for, and whether it is verified.",
        steps: [
          { title: "Open State funding", href: "/dashboard/admissions/state-funding" },
          { title: "Find the family" },
          {
            title: "Verify or reject what they supplied",
            detail: "The family is told either way.",
          },
        ],
      },
      {
        id: "scholarships.reconcile",
        title: "Match funder money to students",
        summary: "What arrived, and who it was for.",
        steps: [
          { title: "Open Reconciliation", href: "/dashboard/admissions/reconciliation" },
          {
            title: "Look at what has not matched",
            detail:
              "An unmatched payment has found a student the system does not know about before now.",
          },
          { title: "Match it, or raise it" },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────── Finance
  {
    id: "finance",
    label: "Finance",
    blurb: "Tuition, payment schedules and what families owe.",
    guides: [
      {
        id: "finance.payment-schedule",
        title: "Look at what a family is paying",
        summary: "Their schedule of tuition payments.",
        steps: [
          { title: "Open Payment schedules", href: "/dashboard/finance/schedules" },
          { title: "Find the family" },
          {
            title: "Read the instalments, not the monthly amount",
            detail:
              "On a scheduled plan the monthly figure is deliberately blank — the money lives in the instalments.",
          },
        ],
      },
      {
        id: "finance.tuition-prices",
        title: "Check or change a tuition price",
        summary: "What a program costs.",
        steps: [
          { title: "Open Tuition", href: "/dashboard/finance/tuition" },
          { title: "Find the campus and the program" },
          {
            title: "Change it knowing who it affects",
            detail: "Existing plans keep the price they were built with.",
          },
        ],
      },
      {
        id: "finance.network-numbers",
        title: "See the network's numbers",
        summary: "Where the money actually is.",
        steps: [
          { title: "Open Financial intelligence", href: "/dashboard/finance/intelligence" },
          {
            title: "Read the basis before the number",
            detail:
              "Accrual, from QuickBooks. A figure on a different basis is answering a different question.",
          },
          { title: "Drill into a campus" },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────── Workforce
  {
    id: "hr",
    label: "Workforce",
    blurb: "Staff records and employment.",
    guides: [
      {
        id: "hr.find",
        title: "Look up a member of staff",
        summary: "Their record and their employment details.",
        steps: [
          { title: "Open Workforce", href: "/dashboard/hr" },
          { title: "Find the person" },
          { title: "Open their record" },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────── Executive
  {
    id: "executive",
    label: "Executive",
    blurb: "The network view — briefings, decisions, capacity and risk.",
    guides: [
      {
        id: "executive.morning",
        title: "Read the morning brief",
        summary: "What changed overnight and what needs you.",
        steps: [
          { title: "Open the Founder Morning Brief", href: "/dashboard" },
          {
            title: "Read the tiles",
            detail:
              "The Founder Brief figures come from the real QuickBooks books. Figures elsewhere in Executive may not — check before quoting one.",
          },
          { title: "Follow whatever is flagged" },
        ],
      },
      {
        id: "executive.decisions",
        title: "See the decisions across the network",
        summary: "Everything waiting on a person, everywhere.",
        steps: [
          { title: "Open Executive decisions", href: "/dashboard/executive/decisions" },
          { title: "Work down by how long each has waited" },
        ],
      },
      {
        id: "executive.briefings",
        title: "Read or build a briefing",
        summary: "For a board meeting or an advisor.",
        steps: [
          { title: "Open Briefings", href: "/dashboard/executive/briefings" },
          { title: "Choose the period" },
          {
            title: "Check every figure before it leaves the building",
            detail: "A number in a board pack is one somebody will act on.",
          },
        ],
      },
      {
        id: "executive.capacity",
        title: "See how many seats are left",
        summary: "Where the next student can actually go.",
        steps: [
          { title: "Open Capacity", href: "/dashboard/executive/capacity" },
          { title: "Read it per campus" },
          {
            title: "Take the empty seats to the admissions call list",
            detail: "An empty seat and a waiting family are the same problem from two ends.",
            href: "/dashboard/admissions/waiting",
          },
        ],
      },
      {
        id: "executive.risk",
        title: "See what is at risk",
        summary: "What could go wrong, and where.",
        steps: [
          { title: "Open Risk", href: "/dashboard/executive/risk" },
          { title: "Read what is flagged" },
          { title: "Follow it to the campus it belongs to" },
        ],
      },
      {
        id: "executive.kpis",
        title: "Check the network's measures",
        summary: "The numbers that get tracked over time.",
        steps: [
          { title: "Open KPIs", href: "/dashboard/executive/kpis" },
          { title: "Choose the period" },
          {
            title: "Compare campuses",
            detail: "An average across four campuses often describes none of them.",
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────── Admin
  {
    id: "admin",
    label: "Settings and setup",
    blurb: "Campuses, contacts, branding and the record of who changed what.",
    guides: [
      {
        id: "admin.admissions-contacts",
        title: "Set a campus's admissions contact and booking links",
        summary: "Who handles inquiries, and where families book time.",
        steps: [
          { title: "Open Admissions contacts", href: "/dashboard/admin/admissions-contacts" },
          {
            title: "Set the contact name and email",
            detail: "This is where inquiry alerts go and where a parent's reply lands.",
          },
          {
            title: "Paste BOTH booking links",
            detail:
              "The interest call link and the shadow day link are different schedules. A blank shadow link mails a family an invitation with nothing to click.",
          },
          {
            title: "Read the sentence under the card before you save",
            detail: "It says exactly what a family will get.",
          },
        ],
      },
      {
        id: "admin.campuses",
        title: "Look at or change a campus",
        summary: "The schools themselves.",
        steps: [
          { title: "Open Campuses", href: "/dashboard/admin/campuses" },
          { title: "Open the campus" },
          { title: "Change what you need and save" },
        ],
      },
      {
        id: "admin.branding",
        title: "Change how JAG looks to families",
        summary: "Logo, colours, the name on the emails.",
        steps: [
          { title: "Open Branding", href: "/dashboard/admin/branding" },
          { title: "Make the change" },
          {
            title: "Check a real email afterwards",
            detail: "Branding shows up in places you will not think to look.",
            href: "/dashboard/communications",
          },
        ],
      },
      {
        id: "admin.audit",
        title: "Find out who did something",
        summary: "The record of what changed and who changed it.",
        steps: [
          { title: "Open Audit", href: "/dashboard/admin/audit" },
          { title: "Filter to the period or the person" },
          { title: "Read the entry" },
        ],
      },
    ],
  },
];

/** Flat list, for lookup by id. */
export const ALL_GUIDES: readonly Guide[] = GUIDE_AREAS.flatMap((a) => a.guides);

export function guideById(id: string): Guide | null {
  return ALL_GUIDES.find((g) => g.id === id) ?? null;
}

export function areaOfGuide(id: string): GuideArea | null {
  return GUIDE_AREAS.find((a) => a.guides.some((g) => g.id === id)) ?? null;
}

/**
 * Searches the words a person would actually type.
 *
 * Title, summary and area, plus every step title AND detail — because somebody
 * looking for "date of birth" is describing a step, not a walkthrough, and the
 * walkthrough that fixes it is called something else entirely.
 *
 * Lives here rather than in the chooser so it can be tested without a browser,
 * and so a second entry point later searches the same way.
 */
export function searchGuides(query: string): { area: GuideArea; guide: Guide }[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const out: { area: GuideArea; guide: Guide }[] = [];
  for (const area of GUIDE_AREAS) {
    for (const guide of area.guides) {
      const haystack = [
        guide.title,
        guide.summary,
        area.label,
        area.blurb,
        ...guide.steps.map((s) => s.title),
        ...guide.steps.map((s) => s.detail ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      if (haystack.includes(needle)) out.push({ area, guide });
    }
  }
  return out;
}

/** Every href a guide can send somebody to — the test checks each one exists. */
export function allGuideHrefs(): string[] {
  const hrefs = new Set<string>();
  for (const area of GUIDE_AREAS) {
    for (const guide of area.guides) {
      for (const step of guide.steps) {
        if (step.href) hrefs.add(step.href);
      }
    }
  }
  return [...hrefs].sort();
}
