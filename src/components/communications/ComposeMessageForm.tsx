"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  composeMessageAction,
  previewTemplateAction,
} from "@/lib/communications/actions";
import type { CommunicationTemplateRow } from "@/lib/communications/types";

interface ComposeMessageFormProps {
  templates: CommunicationTemplateRow[];
  defaultSchoolId?: string | null;
  defaultStudentId?: string | null;
  defaultFamilyId?: string | null;
}

export function ComposeMessageForm({
  templates,
  defaultSchoolId,
  defaultStudentId,
  defaultFamilyId,
}: ComposeMessageFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ subject: string; bodyText: string } | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId]
  );

  function applyTemplate(id: string) {
    setTemplateId(id);
    const t = templates.find((row) => row.id === id);
    if (!t) return;
    setSubject(t.subject);
    setBodyText(t.body_text);
  }

  async function runPreview() {
    if (!templateId) {
      setPreview({ subject, bodyText });
      return;
    }
    const result = await previewTemplateAction(templateId, {
      StudentName: "Alex Student",
      GuardianName: "Jordan Guardian",
      School: "Academy Sample",
      Teacher: "Ms. Rivera",
      Program: "Academy Program",
    });
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if ("preview" in result && result.preview) {
      setPreview({
        subject: result.preview.subject,
        bodyText: result.preview.bodyText,
      });
    }
  }

  function submit(mode: "send" | "draft" | "schedule") {
    setError(null);
    startTransition(async () => {
      const form = document.getElementById("compose-form") as HTMLFormElement;
      const fd = new FormData(form);
      fd.set("mode", mode);
      fd.set("subject", subject);
      fd.set("body_text", bodyText);
      if (templateId) fd.set("template_id", templateId);
      const result = await composeMessageAction(fd);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.push("/dashboard/communications");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <form id="compose-form" className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <input type="hidden" name="school_id" value={defaultSchoolId ?? ""} />
        <input type="hidden" name="student_id" value={defaultStudentId ?? ""} />
        <input type="hidden" name="family_id" value={defaultFamilyId ?? ""} />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Type</span>
            <select name="type" defaultValue="email" className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="portal">Portal</option>
              <option value="reminder">Reminder</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Audience</span>
            <select name="audience_scope" defaultValue="family" className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="student">Individual student</option>
              <option value="guardian">Individual guardian</option>
              <option value="family">Entire family</option>
              <option value="teacher">Teacher</option>
              <option value="employee">Employee</option>
              <option value="class">Entire class</option>
              <option value="program">Entire program</option>
              <option value="school">Entire school</option>
              <option value="custom">Custom recipients</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Recipient name</span>
            <input name="recipient_name" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Email</span>
            <input name="recipient_email" type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Phone</span>
            <input name="recipient_phone" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Subject</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Message</span>
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            rows={12}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-sans"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Schedule (optional)</span>
          <input
            name="scheduled_for"
            type="datetime-local"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Recurrence (optional RRULE)</span>
          <input
            name="schedule_rrule"
            placeholder="FREQ=WEEKLY;BYDAY=MO"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => submit("send")}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Send
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => submit("draft")}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => submit("schedule")}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Schedule
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void runPreview()}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Preview
          </button>
        </div>
      </form>

      <aside className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Templates</h3>
          <select
            value={templateId}
            onChange={(e) => applyTemplate(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {selectedTemplate && (
            <p className="mt-2 text-xs text-slate-500">
              Variables: {(selectedTemplate.variables ?? []).join(", ") || "none"}
            </p>
          )}
        </div>

        {preview && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
            <p className="mt-2 text-sm font-medium">{preview.subject}</p>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-700">{preview.bodyText}</pre>
          </div>
        )}
      </aside>
    </div>
  );
}
