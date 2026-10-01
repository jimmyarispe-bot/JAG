import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";

/**
 * Who is asking, and can they have a week?
 *
 * THIS DOES NOT REDIRECT, AND THAT IS THE POINT.
 *
 * The old Teacher Workspace sends anyone without an employee record back to
 * /dashboard/teacher, which under the access change will be this page - so a
 * teacher whose account is not linked would bounce between a page and itself,
 * or land on an amber box with no way out. Jimmy hit that box himself on
 * 30 September: "Your user account is not linked to an active employee
 * record."
 *
 * Once a teacher is pinned to one page, that page is the whole product. It
 * has to be able to say what is wrong and who fixes it, in a sentence, while
 * still rendering. So this returns a reason rather than throwing the person
 * somewhere else.
 *
 * It also returns the reason to the server actions, which is why it is shared
 * rather than living in the page: an action that silently does nothing is the
 * failure this whole model was rebuilt to stop.
 */

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type TeacherWeekContext =
  | { supabase: AuthClient; employeeId: string; fullName: string }
  | { error: string; signedIn: boolean };

export async function requireTeacherWeekContext(): Promise<TeacherWeekContext> {
  const identity = await getIdentityContext();
  if (!identity) {
    return {
      signedIn: false,
      error: "You are signed out. Sign in again to see your week.",
    };
  }

  const supabase = await createAuthClient();

  const { data, error } = await supabase
    .from("employees")
    .select("id, employment_status")
    .eq("user_id", identity.effectiveUserId)
    .eq("employment_status", "active")
    .maybeSingle();

  /* A refused read and an absent row are different problems with different
     people to chase, and telling them apart costs one branch. */
  if (error) {
    return {
      signedIn: true,
      error:
        `Your staff record could not be read (${error.message}). ` +
        `This is a platform fault rather than anything you have done — tell Jimmy.`,
    };
  }

  if (!data?.id) {
    return {
      signedIn: true,
      error:
        "Your sign-in is not yet linked to a staff record, so there is no week to show. " +
        "Nothing is lost and nothing is late — ask Jimmy or Heather to link it, and " +
        "everything you have taught will be here to log once they have.",
    };
  }

  return {
    supabase,
    employeeId: String(data.id),
    fullName: identity.fullName ?? "",
  };
}
