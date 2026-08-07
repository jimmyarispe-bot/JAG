import { createAnonServerClient } from "@/lib/supabase/server";
import {
  classifyListeningPublicError,
  resolvePublicListeningCampaign,
  toRespondentView,
  type ListeningPublicErrorView,
  type ListeningRespondentView,
} from "@/lib/platform/listening";

export type ResolveListeningResult =
  | { readonly ok: true; readonly view: ListeningRespondentView }
  | { readonly ok: false; readonly error: ListeningPublicErrorView };

export async function resolveListeningForToken(
  token: string
): Promise<ResolveListeningResult> {
  try {
    const supabase = createAnonServerClient();
    const contract = await resolvePublicListeningCampaign(supabase, token);
    return { ok: true, view: toRespondentView(contract) };
  } catch (e) {
    return { ok: false, error: classifyListeningPublicError(e) };
  }
}
