import type { createAuthClient } from "@/lib/supabase/server-auth";
import { createMissionControlItem } from "@/lib/platform/automation/mission-control";
import { writePlatformAudit } from "@/lib/platform/automation/audit";
import { parseProgramValue } from "@/lib/constants/programs";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type ConversionSource = "manual" | "decision" | "automation" | "portal";

/**
 * The lead stages that mean "this child is coming", and so may become a student
 * without an application.
 *
 * Deliberately short. Every other stage - information_sent, shadow_day_scheduled,
 * interview_scheduled, declined, not_returning - describes a family who has not
 * committed, and converting one of those would create a student, a family and a
 * guardian record for a child who never enrolled.
 */
export const CONVERTIBLE_LEAD_STAGES: readonly string[] = ["accepted", "enrolled"];

export interface ConvertAcceptedApplicantInput {
  /**
   * The application this conversion comes from, when there is one.
   *
   * OPTIONAL, AND USUALLY ABSENT. Measured on 20 September 2026:
   * admissions_applications held zero rows and sis_admissions_conversions held
   * zero rows, against 102 students and 315 leads. There is no application form
   * in the JAG, so requiring an application made conversion impossible and
   * every student arrived by a route that recorded nothing.
   *
   * A lead alone is enough. Families here enquire, are accepted, and enrol.
   */
  applicationId?: string | null;
  leadId: string;
  convertedBy?: string | null;
  source?: ConversionSource;
}

export interface ConversionResult {
  success: boolean;
  studentId?: string;
  familyId?: string | null;
  conversionId?: string;
  alreadyExists?: boolean;
  error?: string;
}

const DOCUMENT_TYPE_MAP: Record<string, string> = {
  birth_certificate: "birth_certificate",
  report_card: "testing",
  transcript: "transcript",
  iep: "iep",
  "504": "504",
  evaluation: "evaluations",
  medical: "medical",
  custody: "custody",
  immunization: "medical",
  progress_report: "progress_reports",
};

function mapDocumentType(admissionsType: string): string {
  const key = admissionsType.toLowerCase().replace(/\s+/g, "_");
  return DOCUMENT_TYPE_MAP[key] ?? admissionsType;
}

async function findExistingConversion(
  supabase: AuthClient,
  applicationId: string | null,
  leadId: string
): Promise<{ studentId: string; conversionId: string } | null> {
  /* Without an application the lead IS the identity of the conversion, so it
     is what we look up by. Get this wrong and converting the same child twice
     creates a second family, a second guardian and a duplicate enrolment -
     silently, because every one of those inserts succeeds on its own. */
  const byConversion = applicationId
    ? await supabase
        .from("sis_admissions_conversions")
        .select("id, student_id")
        .eq("application_id", applicationId)
        .maybeSingle()
    : await supabase
        .from("sis_admissions_conversions")
        .select("id, student_id")
        .eq("lead_id", leadId)
        .maybeSingle();

  if (byConversion.data) {
    return { studentId: byConversion.data.student_id, conversionId: byConversion.data.id };
  }

  const byStudent = applicationId
    ? await supabase
        .from("students")
        .select("id")
        .eq("admissions_application_id", applicationId)
        .maybeSingle()
    : await supabase
        .from("students")
        .select("id")
        .eq("admissions_lead_id", leadId)
        .maybeSingle();

  if (byStudent.data) {
    return { studentId: byStudent.data.id, conversionId: "" };
  }

  return null;
}

export async function convertAcceptedApplicantToStudent(
  supabase: AuthClient,
  input: ConvertAcceptedApplicantInput
): Promise<ConversionResult> {
  const { applicationId = null, leadId, convertedBy = null, source = "decision" } = input;

  const existing = await findExistingConversion(supabase, applicationId, leadId);
  if (existing) {
    return {
      success: true,
      studentId: existing.studentId,
      alreadyExists: true,
      conversionId: existing.conversionId || undefined,
    };
  }

  const { data: lead, error: leadError } = await supabase
    .from("admissions_leads")
    .select(
      "id, school_id, first_name, last_name, preferred_name, date_of_birth, current_grade, applying_for_grade, program, guardian_first_name, guardian_last_name, guardian_email, guardian_phone"
    )
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return { success: false, error: leadError?.message ?? "Lead not found" };
  }

  type ApplicationRow = {
    id: string;
    school_year_id: string | null;
    application_status: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    learning_needs_summary: string | null;
    previous_school: string | null;
  };

  let application: ApplicationRow | null = null;

  if (applicationId) {
    const { data, error: appError } = await supabase
      .from("admissions_applications")
      .select(
        "id, school_year_id, application_status, emergency_contact_name, emergency_contact_phone, learning_needs_summary, previous_school"
      )
      .eq("id", applicationId)
      .single();

    if (appError || !data) {
      return { success: false, error: appError?.message ?? "Application not found" };
    }
    if (data.application_status !== "accepted") {
      return { success: false, error: "Application is not accepted" };
    }
    application = data as ApplicationRow;
  }

  /* WHICH YEAR THIS CHILD IS ENROLLED IN.
     With an application the year comes from it. Without one it comes from the
     school's current year - and if the school has no current year this refuses
     rather than creating a student enrolled in nothing. A conversion that
     cannot say which year a child is in has not enrolled them, which is the
     reasoning already written into the enrolment step below. */
  let schoolYearId: string | null = application?.school_year_id ?? null;

  if (!schoolYearId) {
    const { data: currentYear } = await supabase
      .from("school_years")
      .select("id")
      .eq("school_id", lead.school_id)
      .eq("is_current", true)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    schoolYearId = currentYear?.id ?? null;
  }

  /* A CHILD WHO IS ALREADY A STUDENT MUST BE LINKED, NOT CREATED AGAIN.
   *
   * findExistingConversion above looks for students.admissions_lead_id = leadId.
   * That is the link this function exists to create, so it cannot find a child
   * who is already a student but not yet linked - and 100 of 102 students are
   * in exactly that state.
   *
   * Rylan Jex proved it on 20 September 2026: a real student, no link, and the
   * candidate list said "no student record". Converting him would have produced
   * a second Rylan, a second family and a second guardian, every insert
   * succeeding on its own.
   *
   * IT SEARCHES THE WHOLE NETWORK, NOT ONE SCHOOL - CORRECTED 20 SEPTEMBER.
   *
   * The first version of this guard filtered on the lead's school_id, and on
   * 20 September that let a real child through. La'Marrieon Williams had been
   * archived at The Academy GA on 5 September; his lead sat at The Academy HS;
   * the guard looked only at HS, found nothing, and created a second record for
   * a child already in the system. A family that moves campus, or was recorded
   * at the wrong one, is exactly the case a duplicate guard exists for.
   *
   * A NEAR MATCH REFUSES. IT NEVER LINKS.
   *
   * Two real near misses turned up in one afternoon, both in the Google
   * directory: Maximillian Salas against "Max Salas", and Kelvin McClean
   * against a record reading "Kelvin Smith". Neither should be resolved by a
   * machine - one is a shortened first name, the other a different surname
   * entirely, and only a person knows which is the same child. Fuzziness here exists to STOP the conversion and
   * name the candidates, not to pick one - because linking the wrong child
   * attaches somebody else's family, guardian and scholarship to them, which is
   * the worst thing this function can do.
   *
   * So: an exact name match anywhere in the network links. Anything merely
   * close refuses and says who it found. Nothing at all creates.
   */
  if (!applicationId) {
    const leadFirst = (lead.first_name ?? "").trim();
    const leadLast = (lead.last_name ?? "").trim();

    /* Apostrophes, hyphens, spaces and case are noise - "La'Marrieon" and
       "LaMarrieon" are one child. Everything else is signal. */
    const squash = (value: string | null | undefined) =>
      (value ?? "").toLowerCase().replace(/[^a-z]/g, "");

    const leadFirstKey = squash(leadFirst);
    const leadLastKey = squash(leadLast);

    /* Cast a wide net in SQL, decide narrowly in code. A four-character
       surname prefix catches a mistyped or hyphen-dropped surname; the
       first-name arm catches a changed surname - Kelvin McClean against Kelvin
       Smith - which no surname search could ever reach. */
    const surnamePrefix = leadLastKey.slice(0, 4);
    const orFilter = [
      surnamePrefix ? `last_name.ilike.${surnamePrefix}%` : null,
      leadFirstKey ? `first_name.ilike.${leadFirst}` : null,
    ]
      .filter(Boolean)
      .join(",");

    const { data: candidates, error: sameNameError } = orFilter
      ? await supabase
          .from("students")
          .select("id, admissions_lead_id, family_id, first_name, last_name, school_id, status")
          .or(orFilter)
      : { data: [], error: null };

    if (sameNameError) {
      return { success: false, error: sameNameError.message };
    }

    const rows = (candidates ?? []) as Array<{
      id: string;
      admissions_lead_id: string | null;
      family_id: string | null;
      first_name: string | null;
      last_name: string | null;
      status: string | null;
    }>;

    const exact = rows.filter(
      (r) => squash(r.first_name) === leadFirstKey && squash(r.last_name) === leadLastKey
    );

    if (exact.length > 1) {
      return {
        success: false,
        error:
          `${leadFirst} ${leadLast} matches ${exact.length} student records across the network. ` +
          `Link the lead to the right one by hand - converting would create another.`,
      };
    }

    /* Nothing exact, but something close. STOP, and say what was found. An
       archived record counts: La'Marrieon was archived, and archived is the
       state a returning family arrives in. */
    if (exact.length === 0 && rows.length > 0) {
      const near = rows
        .slice(0, 5)
        .map(
          (r) =>
            `${r.first_name ?? "?"} ${r.last_name ?? "?"}${r.status === "archived" ? " (archived)" : ""}`
        )
        .join(", ");
      return {
        success: false,
        error:
          `${leadFirst} ${leadLast} is not an exact match for any student, but these are close: ${near}. ` +
          `A person has to say whether one of them is this child. Converting now could create a second ` +
          `record for a child who is already here.`,
      };
    }

    const existingStudent = exact[0];
    if (existingStudent) {
      if (!existingStudent.admissions_lead_id) {
        const { error: linkError } = await supabase
          .from("students")
          .update({ admissions_lead_id: leadId, updated_at: new Date().toISOString() })
          .eq("id", existingStudent.id);
        if (linkError) {
          return { success: false, error: linkError.message };
        }
      }

      /* Record the conversion so the student's Admissions, Documents and
         Scholarships tabs have something to read - they load through
         getStudentConversion(), which is why they have been empty on every
         student record since the day they were built. */
      const { data: linkConversion } = await supabase
        .from("sis_admissions_conversions")
        .insert({
          application_id: null,
          lead_id: leadId,
          student_id: existingStudent.id,
          family_id: existingStudent.family_id ?? null,
          converted_by: convertedBy,
          conversion_source: source,
          snapshot: {
            lead_id: leadId,
            application_id: null,
            linked_existing_student: true,
            converted_at: new Date().toISOString(),
          },
        })
        .select("id")
        .maybeSingle();

      /* familyId is NOT optional to the caller. completeEnrollmentHandoff
         refuses with "Conversion did not return student or family id", so
         returning a student without their family would fail the handoff at the
         one step that matters - after the link had already been written. */
      return {
        success: true,
        studentId: existingStudent.id,
        familyId: existingStudent.family_id ?? null,
        alreadyExists: true,
        conversionId: linkConversion?.id,
      };
    }
  }

  const { data: studentNumber } = await supabase.rpc("generate_student_number", {
    p_school_id: lead.school_id,
  });

  const gradeLevel = lead.applying_for_grade ?? lead.current_grade;
  const today = new Date().toISOString().split("T")[0];

  const familyName =
    lead.guardian_last_name?.trim() ||
    lead.last_name?.trim() ||
    `${lead.first_name} Family`;

  const { data: family, error: familyError } = await supabase
    .from("families")
    .insert({
      school_id: lead.school_id,
      family_name: familyName,
      billing_email: lead.guardian_email,
      billing_phone: lead.guardian_phone,
      status: "active",
    })
    .select("id")
    .single();

  if (familyError || !family) {
    return { success: false, error: familyError?.message ?? "Failed to create family" };
  }

  // Canonicalize legacy lead.program codes before students_program_check.
  const program = parseProgramValue(lead.program);
  if (lead.program && !program) {
    return {
      success: false,
      error: `Invalid lead program "${lead.program}". Update the lead to a canonical program before conversion.`,
    };
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      school_id: lead.school_id,
      family_id: family.id,
      first_name: lead.first_name,
      last_name: lead.last_name,
      preferred_name: lead.preferred_name,
      date_of_birth: lead.date_of_birth,
      grade_level: gradeLevel,
      program,
      school_year_id: schoolYearId,
      enrollment_status: "enrolled",
      enrollment_start_date: today,
      status: "active",
      lifecycle_stage: "accepted",
      student_number: studentNumber as string,
      admissions_lead_id: leadId,
      admissions_application_id: applicationId ?? null,
    })
    .select("id")
    .single();

  if (studentError || !student) {
    return { success: false, error: studentError?.message ?? "Failed to create student" };
  }

  // The student's enrolment for the year. The people directory, the family
  // profile and the student profile all read this table, so a student with no
  // row here is a student who does not appear to be enrolled anywhere.
  //
  // Two things were wrong, and both were silent.
  //
  // The conflict target is (student_id, school_year_id, PROGRAM). Migration 229
  // dropped (student_id, school_year_id) so one child can hold several programs
  // in a year, and naming a constraint that no longer exists makes Postgres
  // answer 42P10. The result was never checked, so that error was discarded,
  // the student was created regardless, and this function returned success with
  // the enrolment row unwritten.
  //
  // A missing school year did the same damage from the other end: the row
  // simply never appeared. Refuse instead. A conversion that cannot say which
  // year a child is enrolled in has not enrolled them.
  if (!schoolYearId) {
    return {
      success: false,
      error:
        "No school year could be found for this child, so they cannot be enrolled. Set the school's current year and try again.",
    };
  }

  const { error: enrollmentError } = await supabase.from("sis_enrollments").upsert(
    {
      student_id: student.id,
      school_year_id: schoolYearId,
      program: program ?? "academy_virtual",
      enrollment_status: "enrolled",
      enrolled_at: today,
      lead_id: leadId,
      is_primary: true,
    },
    { onConflict: "student_id,school_year_id,program" }
  );

  if (enrollmentError) {
    // Say plainly what this left behind. The student record exists; the
    // enrolment does not. Reporting success here is what hid this.
    return {
      success: false,
      error: `Student ${studentNumber} was created but could not be enrolled: ${enrollmentError.message}. That record needs attention before this family is billed.`,
    };
  }

  if (lead.guardian_first_name || lead.guardian_last_name) {
    await supabase.from("guardians").insert({
      family_id: family.id,
      first_name: lead.guardian_first_name ?? "Guardian",
      last_name: lead.guardian_last_name ?? lead.last_name,
      email: lead.guardian_email,
      phone: lead.guardian_phone,
      relationship_to_student: "parent",
      is_primary: true,
      receives_billing: true,
      receives_communications: true,
      contact_type: "parent",
      is_emergency_contact: true,
    });
  }

  const { data: leadGuardians } = await supabase
    .from("admissions_lead_guardians")
    .select("*")
    .eq("lead_id", leadId);

  const guardianEmails = [
    ...new Set((leadGuardians ?? []).map((lg) => lg.email).filter(Boolean)),
  ] as string[];
  const existingEmails = new Set<string>();
  if (guardianEmails.length) {
    const { data: existingGuardians } = await supabase
      .from("guardians")
      .select("email")
      .eq("family_id", family.id)
      .in("email", guardianEmails);
    for (const g of existingGuardians ?? []) {
      if (g.email) existingEmails.add(g.email);
    }
  }

  const guardiansToInsert = (leadGuardians ?? [])
    .filter((lg) => !lg.email || !existingEmails.has(lg.email))
    .map((lg) => ({
      family_id: family.id,
      first_name: lg.first_name,
      last_name: lg.last_name,
      email: lg.email,
      phone: lg.phone,
      relationship_to_student: lg.relationship_to_student,
      is_primary: lg.primary_guardian ?? false,
      receives_billing: lg.receives_billing ?? false,
      receives_communications: lg.receives_school_communications ?? true,
      contact_type: "guardian",
    }));

  if (guardiansToInsert.length) {
    await supabase.from("guardians").insert(guardiansToInsert);
  }

  if (application?.emergency_contact_name) {
    const parts = application.emergency_contact_name.trim().split(/\s+/);
    const firstName = parts[0] ?? "Emergency";
    const lastName = parts.slice(1).join(" ") || "Contact";
    await supabase.from("student_authorized_contacts").insert({
      student_id: student.id,
      contact_type: "emergency",
      first_name: firstName,
      last_name: lastName,
      phone: application?.emergency_contact_phone ?? null,
      can_pick_up: false,
      receives_communications: true,
    });
  }

  const { data: leadFunding } = await supabase
    .from("admissions_lead_funding_sources")
    .select("funding_source_id")
    .eq("lead_id", leadId);

  if (leadFunding?.length) {
    await supabase.from("student_funding_sources").upsert(
      leadFunding.map((row) => ({
        student_id: student.id,
        funding_source_id: row.funding_source_id,
      })),
      { onConflict: "student_id,funding_source_id" }
    );
  }

  const { data: stateFunding } = await supabase
    .from("state_funding_verifications")
    .select("id, state_student_id")
    .eq("application_id", applicationId);

  const stateIds: { state: string; id: string }[] = [];
  const fundingIds = (stateFunding ?? []).map((sf) => sf.id);
  if (fundingIds.length) {
    await supabase
      .from("state_funding_verifications")
      .update({ student_id: student.id, lead_id: leadId })
      .in("id", fundingIds);
  }
  for (const sf of stateFunding ?? []) {
    if (sf.state_student_id) {
      stateIds.push({ state: "FL", id: sf.state_student_id });
    }
  }

  if (stateIds.length) {
    await supabase
      .from("students")
      .update({ state_student_ids: stateIds })
      .eq("id", student.id);
  }

  await supabase.from("student_learning_profiles").upsert(
    {
      student_id: student.id,
      support_notes: application?.learning_needs_summary ?? null,
      iep_status: "none",
    },
    { onConflict: "student_id" }
  );

  if (application && (application.emergency_contact_name || application.emergency_contact_phone)) {
    await supabase.from("student_medical_profiles").insert({
      student_id: student.id,
      health_alerts: application.learning_needs_summary
        ? [{ type: "admissions_note", text: application.learning_needs_summary }]
        : [],
      notes: application.previous_school
        ? `Previous school: ${application.previous_school}`
        : null,
    });
  }

  /* THE DOCUMENTS FOLLOW THE CHILD.
     application_documents carries BOTH application_id and lead_id - the lead_id
     column added by migration 326 is what a family's interest-form upload
     attaches to, and querying the wrong one of those two is what hid three
     scholarship award letters for three days in September.
     With no application, the lead is the only link there is.

     NO STATUS FILTER ON THE LEAD PATH, deliberately. "approved" belongs to an
     application review that never happens here; an inquiry upload has no such
     workflow, so filtering on it would inherit nothing and report success. */
  const DOCUMENT_COLUMNS =
    "id, document_type, document_subtype, file_name, storage_path, mime_type, file_size_bytes, uploaded_by";

  const { data: appDocs } = applicationId
    ? await supabase
        .from("application_documents")
        .select(DOCUMENT_COLUMNS)
        .eq("application_id", applicationId)
        .eq("document_status", "approved")
    : await supabase
        .from("application_documents")
        .select(DOCUMENT_COLUMNS)
        .eq("lead_id", leadId);

  if (!appDocs?.length) {
    const { data: allDocs } = await supabase
      .from("application_documents")
      .select("id, document_type, document_subtype, file_name, storage_path, mime_type, file_size_bytes, uploaded_by")
      .eq("application_id", applicationId);
    for (const doc of allDocs ?? []) {
      await inheritApplicationDocument(supabase, student.id, doc, convertedBy);
    }
  } else {
    for (const doc of appDocs) {
      await inheritApplicationDocument(supabase, student.id, doc, convertedBy);
    }
  }

  const snapshot = {
    lead_id: leadId,
    application_id: applicationId,
    lead_stage: "accepted",
    application_status: application?.application_status ?? null,
    converted_at: new Date().toISOString(),
  };

  const { data: conversion, error: conversionError } = await supabase
    .from("sis_admissions_conversions")
    .insert({
      application_id: applicationId ?? null,
      lead_id: leadId,
      student_id: student.id,
      family_id: family.id,
      converted_by: convertedBy,
      conversion_source: source,
      snapshot,
    })
    .select("id")
    .single();

  if (conversionError) {
    return { success: false, error: conversionError.message };
  }

  await writePlatformAudit(supabase, {
    schoolId: lead.school_id,
    module: "sis",
    actionType: "admissions_conversion",
    summary: `Converted accepted applicant to student ${studentNumber}`,
    entityType: "student",
    entityId: student.id,
    actorUserId: convertedBy,
    metadata: { applicationId, leadId, conversionId: conversion.id },
  });

  await createMissionControlItem(supabase, {
    schoolId: lead.school_id,
    module: "sis",
    itemType: "overdue_task",
    title: `New student enrolled: ${lead.first_name} ${lead.last_name}`,
    body: `Student #${studentNumber} converted from admissions. Review profile and schedule.`,
    entityType: "student",
    entityId: student.id,
    href: `/dashboard/students/${student.id}`,
    assignedRole: "REGISTRAR",
    severity: "normal",
  });

  const { transitionStudentLifecycle } = await import("@/lib/ssis/transitions");
  await transitionStudentLifecycle(supabase, {
    studentId: student.id,
    toStage: "enrolled",
    triggerSource: source === "portal" || source === "decision" ? "admissions" : source,
    triggeredBy: convertedBy,
    notes: "Converted from accepted admissions application",
    metadata: { applicationId, leadId },
  });

  const { syncStudentFundingRecords } = await import("@/lib/ssis/funding");
  await syncStudentFundingRecords(supabase, student.id, applicationId);

  await supabase
    .from("scholarship_applications")
    .update({ student_id: student.id })
    .eq("application_id", applicationId);

  const { logStudentCommunicationEvent } = await import("@/lib/ssis/timeline");
  await logStudentCommunicationEvent(supabase, {
    studentId: student.id,
    schoolId: lead.school_id,
    channel: "workflow",
    direction: "internal",
    subject: "Student record created from admissions",
    body: `${lead.first_name} ${lead.last_name} enrolled as student #${studentNumber}`,
    actorUserId: convertedBy,
    relatedEntityType: "admissions_applications",
    relatedEntityId: applicationId,
  });

  const { computeStudentSuccessScore } = await import("@/lib/ssis/score");
  await computeStudentSuccessScore(supabase, student.id);

  return {
    success: true,
    studentId: student.id,
    familyId: family.id,
    conversionId: conversion.id,
  };
}

async function inheritApplicationDocument(
  supabase: AuthClient,
  studentId: string,
  doc: {
    id: string;
    document_type: string;
    document_subtype: string | null;
    file_name: string;
    storage_path: string;
    mime_type: string | null;
    file_size_bytes: number | null;
    uploaded_by: string | null;
  },
  convertedBy: string | null
) {
  const { data: existing } = await supabase
    .from("student_documents")
    .select("id")
    .eq("application_document_id", doc.id)
    .maybeSingle();

  if (existing) return;

  await supabase.from("student_documents").insert({
    student_id: studentId,
    document_type: mapDocumentType(doc.document_type),
    document_subtype: doc.document_subtype,
    file_name: doc.file_name,
    storage_path: doc.storage_path,
    mime_type: doc.mime_type,
    file_size_bytes: doc.file_size_bytes,
    uploaded_by: doc.uploaded_by ?? convertedBy,
    source_type: "admissions",
    application_document_id: doc.id,
    inherited_at: new Date().toISOString(),
    status: "active",
  });
}

export async function convertAcceptedApplicantByLead(
  supabase: AuthClient,
  leadId: string,
  convertedBy?: string | null,
  source: ConversionSource = "decision"
): Promise<ConversionResult> {
  const { data: application } = await supabase
    .from("admissions_applications")
    .select("id")
    .eq("lead_id", leadId)
    .eq("application_status", "accepted")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  /* NO APPLICATION IS THE NORMAL CASE, NOT AN ERROR.
     This used to stop here and return "No accepted application found for lead".
     Measured on 20 September 2026, admissions_applications held ZERO rows - so
     this function could never return anything else, for any family, ever. The
     handle existed on a door that was bolted shut.

     There is no application form in the JAG. Families enquire, are accepted,
     and enrol, and the application exists only on paper that never reaches the
     platform. So a lead at a stage that means "this child is coming" is enough.

     THE STAGE CHECK IS THE SAFETY. Without it this would happily convert a
     prospect who declined, creating a student, a family and a guardian for a
     child who never enrolled. */
  if (!application) {
    const { data: lead, error: leadError } = await supabase
      .from("admissions_leads")
      .select("id, lead_stage, first_name, last_name")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return { success: false, error: leadError?.message ?? "Lead not found" };
    }

    if (!CONVERTIBLE_LEAD_STAGES.includes(lead.lead_stage ?? "")) {
      return {
        success: false,
        error:
          `${lead.first_name} ${lead.last_name} is at stage "${lead.lead_stage}". ` +
          `Only a lead at ${CONVERTIBLE_LEAD_STAGES.join(" or ")} becomes a student.`,
      };
    }

    return convertAcceptedApplicantToStudent(supabase, {
      applicationId: null,
      leadId,
      convertedBy,
      source,
    });
  }

  return convertAcceptedApplicantToStudent(supabase, {
    applicationId: application.id,
    leadId,
    convertedBy,
    source,
  });
}
