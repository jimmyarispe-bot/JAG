"use server";

import { redirect } from "next/navigation";

import { skipNextStage } from "@/lib/admissions/automation/skip-stage";

/**
 * One press, one stage, and a redirect so a refresh cannot do it twice.
 *
 * THE DOUBLE-SUBMIT GUARD IS NOT OPTIONAL HERE. A second press does not
 * repeat the first - it skips the NEXT stage as well, because the ladder
 * reads the child's live stage. A refresh without this would walk a child
 * from the interest meeting to the admissions decision in two keystrokes
 * nobody meant to make.
 *
 * THE FAILURE IS CARRIED, NOT FLATTENED, the same way /post-call/<token>
 * carries it: the reason a skip was refused is usually specific - there is
 * nothing after this stage, the child has no campus - and "that did not
 * save" would leave a school leader with nothing to do next.
 */
export async function skipStageAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");

  const expectedStage = String(formData.get("from") ?? "") || null;

  const result = await skipNextStage({ token, expectedStage });

  if ("error" in result) {
    redirect(
      `/skip-stage/${encodeURIComponent(token)}?problem=skip&why=${encodeURIComponent(result.error)}`
    );
  }

  /*
   * THE LETTER'S FAILURE TRAVELS WITH THE SUCCESS, for the reason the
   * acceptance page learned on 14 October. The skip is real whether or not
   * the next letter queued, so this is a `done`; but the page has to be able
   * to say no letter is coming rather than promising one that is not.
   */
  redirect(
    `/skip-stage/${encodeURIComponent(token)}?done=${encodeURIComponent(result.landedOn)}` +
      (result.alreadyDone ? "&again=1" : "") +
      (result.letterProblem ? `&warning=${encodeURIComponent(result.letterProblem)}` : "")
  );
}
