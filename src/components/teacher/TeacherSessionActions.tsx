"use client";

import Link from "next/link";
import { completeSessionAction, startLessonAction, takeSessionAttendanceAction } from "@/lib/teacher/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";

interface SessionCardActionsProps {
  sessionId: string;
  students: { id: string; first_name?: string; last_name?: string }[];
  lessonStatus: string;
}

export function SessionCardActions({ sessionId, students, lessonStatus }: SessionCardActionsProps) {
  const action = useActionFeedback({
    verb: "save",
    successToast: "✓ Updated",
    errorToast: "Unable to update.",
    progressLabel: "Updating session…",
  });
  const firstStudent = students[0];

  return (
    <div className="flex flex-wrap gap-2">
      {lessonStatus === "not_started" && (
        <ActionButton
          type="button"
          status={action.status}
          verb="run"
          labels={{ idle: "Start lesson", loading: "Starting…", success: "✓ Started" }}
          className="!rounded-lg !px-3 !py-1.5 !text-xs"
          onClick={() => {
            void action.run(async () => {
              const fd = new FormData();
              fd.set("session_id", sessionId);
              const r = await startLessonAction(fd);
              assertActionResult(r);
              return r;
            });
          }}
        />
      )}
      <Link
        href={`/dashboard/teacher/sessions/${sessionId}`}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Open workspace
      </Link>
      {firstStudent && (
        <>
          <ActionButton
            type="button"
            status={action.status}
            verb="save"
            variant="secondary"
            labels={{ idle: "Take attendance", loading: "Saving…", success: "✓ Saved" }}
            className="!rounded-lg !border-emerald-200 !bg-emerald-50 !px-3 !py-1.5 !text-xs !text-emerald-700 hover:!bg-emerald-100"
            onClick={() => {
              void action.run(async () => {
                const fd = new FormData();
                fd.set("session_id", sessionId);
                fd.set("student_id", firstStudent.id);
                fd.set("status", "present");
                const r = await takeSessionAttendanceAction(fd);
                assertActionResult(r);
                return r;
              });
            }}
          />
          <Link
            href={`/dashboard/students/${firstStudent.id}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Student profile
          </Link>
        </>
      )}
      <Link
        href={`/dashboard/teacher/sessions/${sessionId}#notes`}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Record notes
      </Link>
      <Link
        href={`/dashboard/teacher/sessions/${sessionId}#artifacts`}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Upload artifact
      </Link>
      <ActionButton
        type="button"
        status={action.status}
        verb="save"
        variant="secondary"
        labels={{ idle: "Complete session", loading: "Completing…", success: "✓ Complete" }}
        className="!rounded-lg !border-brand-200 !bg-brand-50 !px-3 !py-1.5 !text-xs !text-brand-700 hover:!bg-brand-100"
        onClick={() => {
          void action.run(async () => {
            const fd = new FormData();
            fd.set("session_id", sessionId);
            const r = await completeSessionAction(fd);
            assertActionResult(r);
            return r;
          });
        }}
      />
    </div>
  );
}
