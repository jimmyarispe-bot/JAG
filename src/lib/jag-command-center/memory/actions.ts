"use server";

import { revalidatePath } from "next/cache";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { recordLessonLearnedMemory } from "./load-memory";

export async function jagRecordLessonAction(input: {
  organizationId: string;
  organizationName: string;
  title: string;
  description: string;
  whatWorked: string;
  whatFailed: string;
  unexpected: string;
  recommendations: string;
  relatedDecisionId?: string;
}) {
  const session = await getJagPlatformSession();
  if (!session) return { error: "Unauthorized" as const };
  if (!input.title.trim()) return { error: "Title required" as const };

  const split = (s: string) =>
    s
      .split(/\n|;/)
      .map((x) => x.trim())
      .filter(Boolean);

  const record = recordLessonLearnedMemory({
    session,
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    title: input.title.trim(),
    description: input.description.trim(),
    lesson: {
      whatWorked: split(input.whatWorked),
      whatFailed: split(input.whatFailed),
      unexpectedOutcomes: split(input.unexpected),
      recommendations: split(input.recommendations),
    },
    relatedDecisionIds: input.relatedDecisionId
      ? [input.relatedDecisionId]
      : [],
    tags: ["lesson", "executive"],
  });

  revalidatePath("/jag/memory");
  revalidatePath("/jag");
  return { memoryId: record.id };
}

/** FormData entrypoint for Client Component forms (no inline "use server"). */
export async function jagRecordLessonFormAction(formData: FormData): Promise<void> {
  await jagRecordLessonAction({
    organizationId: String(formData.get("organizationId") ?? ""),
    organizationName: String(formData.get("organizationName") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    whatWorked: String(formData.get("whatWorked") ?? ""),
    whatFailed: String(formData.get("whatFailed") ?? ""),
    unexpected: String(formData.get("unexpected") ?? ""),
    recommendations: String(formData.get("recommendations") ?? ""),
    relatedDecisionId:
      String(formData.get("relatedDecisionId") ?? "") || undefined,
  });
}
