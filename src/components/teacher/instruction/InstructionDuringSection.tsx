import { SessionOutcomeForm } from "@/components/instruction/InstructionForms";
import {
  ArtifactForm,
  InterventionForm,
  ParentMessageForm,
  SessionAssessmentForm,
  SessionStudentPanel,
  TeacherNoteForm,
} from "@/components/teacher/TeacherWorkspaceForms";
import { SessionWorkspaceForm } from "@/components/teacher/SessionWorkspaceForm";

type StudentOption = { id: string; first_name?: string; last_name?: string };

interface InstructionDuringSectionProps {
  sessionId: string;
  delivery: {
    session_notes?: string | null;
    homework?: string | null;
    lesson_objectives?: unknown;
    standards?: string[] | null;
    learning_targets?: unknown;
    activities?: unknown;
    lesson_status?: string;
  } | null;
  sessionStudents: StudentOption[];
  rosterStudents: StudentOption[];
  attendanceMap: Map<string, string>;
  recordMap: Map<string, Record<string, unknown>>;
}

export function InstructionDuringSection({
  sessionId,
  delivery,
  sessionStudents,
  rosterStudents,
  attendanceMap,
  recordMap,
}: InstructionDuringSectionProps) {
  const students = sessionStudents.length ? sessionStudents : rosterStudents;

  return (
    <>
      <SessionWorkspaceForm sessionId={sessionId} delivery={delivery} />

      <div className="grid gap-4 sm:grid-cols-2">
        {sessionStudents.map((st) => (
          <SessionStudentPanel
            key={st.id}
            sessionId={sessionId}
            studentId={st.id}
            studentName={`${st.first_name ?? ""} ${st.last_name ?? ""}`.trim()}
            attendanceStatus={attendanceMap.get(st.id) ?? "pending"}
            record={recordMap.get(st.id)}
          />
        ))}
      </div>

      <SessionAssessmentForm sessionId={sessionId} students={students} />
      <ArtifactForm sessionId={sessionId} students={students} />
      <TeacherNoteForm students={students} />
      <InterventionForm students={students} />
      <ParentMessageForm students={students} />

      {sessionStudents.map((st) => (
        <SessionOutcomeForm key={st.id} sessionId={sessionId} studentId={st.id} />
      ))}
    </>
  );
}
