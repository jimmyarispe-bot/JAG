"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  experienceSaveApplicationDraft,
  experienceSubmitApplication,
} from "@/lib/admissions/experience/actions";
import { APPLICATION_WIZARD_STEPS } from "@/lib/admissions/experience/constants";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import {
  portalInputClass,
  portalLabelClass,
  portalSectionClass,
} from "@/components/admissions/portal/styles";
import { PROGRAMS } from "@/lib/constants/programs";

type Defaults = {
  previous_school?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  learning_needs_summary?: string | null;
  medical_notes?: string | null;
  guardian_notes?: string | null;
  student_summary?: string | null;
};

/** The seven columns the wizard writes, as the family's answers-so-far. */
type WizardValues = {
  guardian_notes: string;
  student_summary: string;
  previous_school: string;
  medical_notes: string;
  learning_needs_summary: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
};

function seedValues(defaults: Defaults): WizardValues {
  return {
    guardian_notes: defaults.guardian_notes ?? "",
    student_summary: defaults.student_summary ?? "",
    previous_school: defaults.previous_school ?? "",
    medical_notes: defaults.medical_notes ?? "",
    learning_needs_summary: defaults.learning_needs_summary ?? "",
    emergency_contact_name: defaults.emergency_contact_name ?? "",
    emergency_contact_phone: defaults.emergency_contact_phone ?? "",
  };
}

export function ApplicationWizard({
  applicationId,
  defaults,
}: {
  applicationId: string;
  defaults: Defaults;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [autosaveFailed, setAutosaveFailed] = useState(false);
  const step = APPLICATION_WIZARD_STEPS[stepIndex]!;
  const progress = Math.round(((stepIndex + 1) / APPLICATION_WIZARD_STEPS.length) * 100);

  /**
   * THE FAMILY'S ANSWERS LIVE HERE, NOT IN THE DOM.
   *
   * `defaults` is a snapshot taken when the page was rendered on the server, and
   * it never changes again while the wizard is open. Every step used to seed its
   * fields from that snapshot through `defaultValue`, which was safe only while
   * no column was rendered by more than one step.
   *
   * `previous_school` is rendered by two: step 3 "Educational history" as an
   * input, step 7 "Previous schools" as a textarea. A family who typed their
   * school on step 3 reached step 7 and found the box empty — the snapshot still
   * said empty — and saving step 7 wrote that empty string straight over their
   * answer. `saveApplicationDetails` could not defend against it: the field WAS
   * present in the submission, so from its side the family had deliberately
   * cleared it. The presence check fixed absent fields; this fixes stale ones.
   *
   * Holding the values in state means a step always renders what the family last
   * typed, whichever step they typed it on, and Back shows their work rather
   * than the state of the world when the page loaded.
   */
  const [values, setValues] = useState<WizardValues>(() => seedValues(defaults));

  function set(name: keyof WizardValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const next = e.target.value;
      setValues((v) => ({ ...v, [name]: next }));
    };
  }

  const saveAction = useActionFeedback({
    verb: "save",
    successToast: "Draft saved",
    errorToast: "Unable to save draft.",
    onError: (err) => setError(err.message),
  });

  async function persist(form: HTMLFormElement) {
    const formData = new FormData(form);
    formData.set("application_id", applicationId);
    formData.set("wizard_step", step.id);
    const result = await experienceSaveApplicationDraft(formData);
    if (result.error) throw new Error(result.error);
    setSavedAt(new Date().toLocaleTimeString());
    setAutosaveFailed(false);
    return result;
  }

  /**
   * A failed autosave used to be discarded entirely. The family kept typing under
   * a label reading "Autosaved 2:15 PM" — the last time it HAD worked — with an
   * expired session and nothing reaching the database. Silence wearing a success
   * costume. It now says so.
   */
  useEffect(() => {
    const form = document.getElementById("application-wizard-form") as HTMLFormElement | null;
    if (!form) return;
    const timer = window.setInterval(() => {
      void persist(form).catch(() => setAutosaveFailed(true));
    }, 45_000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autosave bound to form id
  }, [applicationId, step.id]);

  function goNext(form: HTMLFormElement) {
    setError(null);
    void saveAction.run(async () => {
      await persist(form);
      if (stepIndex < APPLICATION_WIZARD_STEPS.length - 1) {
        startTransition(() => setStepIndex((i) => i + 1));
      }
      return { success: true };
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (step.id !== "review") {
      goNext(form);
      return;
    }
    setError(null);
    void saveAction.run(async () => {
      await persist(form);
      const result = await experienceSubmitApplication(applicationId);
      if ("error" in result && result.error) throw new Error(result.error);
      router.refresh();
      return result;
    });
  }

  return (
    <div className={`${portalSectionClass} space-y-6`}>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Online application</h2>
          <p
            className={autosaveFailed ? "text-xs font-medium text-amber-700" : "text-xs text-slate-500"}
            aria-live="polite"
          >
            {autosaveFailed
              ? "Not saved — check your connection"
              : savedAt
                ? `Autosaved ${savedAt}`
                : "Draft autosaves every 45s"}
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-slate-900 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <ol className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          {APPLICATION_WIZARD_STEPS.map((s, i) => (
            <li
              key={s.id}
              className={
                i === stepIndex
                  ? "font-semibold text-slate-900"
                  : i < stepIndex
                    ? "text-emerald-700"
                    : undefined
              }
            >
              {i + 1}. {s.label}
            </li>
          ))}
        </ol>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {autosaveFailed && !error && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <span className="font-medium">We could not save your draft just now.</span>{" "}
          What you have typed is still on this page — please stay here and press
          Save &amp; continue in a moment rather than closing the tab.
        </div>
      )}

      <form id="application-wizard-form" onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="application_id" value={applicationId} />

        {step.id === "guardian" && (
          <fieldset className="space-y-3">
            <legend className="font-medium text-slate-900">Guardian information</legend>
            <p className="text-sm text-slate-500">
              Guardian contact is managed on your inquiry profile. Add notes for admissions here.
            </p>
            <label className={portalLabelClass} htmlFor="guardian_notes">Notes</label>
            <textarea
              id="guardian_notes"
              name="guardian_notes"
              rows={3}
              className={portalInputClass}
              value={values.guardian_notes}
              onChange={set("guardian_notes")}
            />
          </fieldset>
        )}

        {step.id === "student" && (
          <fieldset className="space-y-3">
            <legend className="font-medium text-slate-900">Student information</legend>
            <p className="text-sm text-slate-500">
              Core student fields come from your inquiry. Confirm learning context below.
            </p>
            <label className={portalLabelClass} htmlFor="student_summary">Student summary</label>
            <textarea
              id="student_summary"
              name="student_summary"
              rows={4}
              className={portalInputClass}
              value={values.student_summary}
              onChange={set("student_summary")}
            />
          </fieldset>
        )}

        {step.id === "education" && (
          <fieldset className="space-y-3">
            <legend className="font-medium text-slate-900">Educational history</legend>
            <label className={portalLabelClass} htmlFor="previous_school">Previous school</label>
            <input
              id="previous_school"
              name="previous_school"
              className={portalInputClass}
              value={values.previous_school}
              onChange={set("previous_school")}
            />
          </fieldset>
        )}

        {step.id === "medical" && (
          <fieldset className="space-y-3">
            <legend className="font-medium text-slate-900">Medical information</legend>
            <label className={portalLabelClass} htmlFor="medical_notes">Medical notes</label>
            <textarea
              id="medical_notes"
              name="medical_notes"
              rows={4}
              className={portalInputClass}
              value={values.medical_notes}
              onChange={set("medical_notes")}
              placeholder="Allergies, medications, accommodations (also upload medical docs)"
            />
          </fieldset>
        )}

        {step.id === "learning" && (
          <fieldset className="space-y-3">
            <legend className="font-medium text-slate-900">Learning profile</legend>
            <p className="text-sm text-slate-500">
              Captured for Learning Intelligence and teacher handoff — not a separate pedagogy model.
            </p>
            <label className={portalLabelClass} htmlFor="learning_profile">Learning profile</label>
            <textarea
              id="learning_profile"
              name="learning_needs_summary"
              rows={4}
              className={portalInputClass}
              value={values.learning_needs_summary}
              onChange={set("learning_needs_summary")}
            />
          </fieldset>
        )}

        {step.id === "emergency" && (
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="col-span-full font-medium text-slate-900">Emergency contacts</legend>
            <div>
              <label className={portalLabelClass} htmlFor="emergency_contact_name">Name</label>
              <input
                id="emergency_contact_name"
                name="emergency_contact_name"
                className={portalInputClass}
                value={values.emergency_contact_name}
                onChange={set("emergency_contact_name")}
              />
            </div>
            <div>
              <label className={portalLabelClass} htmlFor="emergency_contact_phone">Phone</label>
              <input
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                className={portalInputClass}
                value={values.emergency_contact_phone}
                onChange={set("emergency_contact_phone")}
              />
            </div>
          </fieldset>
        )}

        {step.id === "schools" && (
          <fieldset className="space-y-3">
            <legend className="font-medium text-slate-900">Previous schools</legend>
            <label className={portalLabelClass} htmlFor="previous_school_detail">School history</label>
            <textarea
              id="previous_school_detail"
              name="previous_school"
              rows={3}
              className={portalInputClass}
              value={values.previous_school}
              onChange={set("previous_school")}
            />
          </fieldset>
        )}

        {step.id === "program" && (
          <fieldset className="space-y-3">
            <legend className="font-medium text-slate-900">Program selection</legend>
            <p className="text-sm text-slate-500">
              Program of interest was set at inquiry. Confirm preference in notes if changing.
            </p>
            <ul className="text-sm text-slate-700">
              {PROGRAMS.map((p) => (
                <li key={p.value}>{p.label}</li>
              ))}
            </ul>
          </fieldset>
        )}

        {step.id === "scholarship" && (
          <fieldset className="space-y-3">
            <legend className="font-medium text-slate-900">Scholarship selection</legend>
            <p className="text-sm text-slate-500">
              Complete financial aid details on the application page scholarship section after this wizard.
              Funding sources remain on Finance / scholarship services.
            </p>
          </fieldset>
        )}

        {step.id === "documents" && (
          <fieldset className="space-y-3">
            <legend className="font-medium text-slate-900">Document upload</legend>
            <p className="text-sm text-slate-500">
              Use the Document Center below (or return to the application page). KnowledgeEngine owns storage.
            </p>
          </fieldset>
        )}

        {step.id === "review" && (
          <fieldset className="space-y-3">
            <legend className="font-medium text-slate-900">Review & submit</legend>
            <p className="text-sm text-slate-600">
              Submitting marks the application submitted, advances the CRM workflow, notifies staff,
              and publishes Digital Twin / Evidence / Memory events.
            </p>
          </fieldset>
        )}

        <div className="flex flex-wrap justify-between gap-3 pt-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
            disabled={stepIndex === 0 || pending || saveAction.isBusy}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            Back
          </button>
          <ActionButton
            type="submit"
            status={saveAction.status}
            verb="submit"
            labels={{
              idle: step.id === "review" ? "Submit application" : "Save & continue",
              loading: step.id === "review" ? "Submitting…" : "Saving…",
              success: "✓ Saved",
            }}
            errorMessage={saveAction.errorMessage}
          />
        </div>
      </form>
    </div>
  );
}
