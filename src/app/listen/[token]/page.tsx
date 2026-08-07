import type { Metadata } from "next";
import {
  ListeningPublicError,
  ListeningRespondentSurvey,
} from "@/components/listening-public";
import { resolveListeningForToken } from "@/lib/listening-public/resolve";
import {
  classifyListeningPublicError,
  isListeningTokenShapeValid,
} from "@/lib/platform/listening";

export const metadata: Metadata = {
  title: "Listening survey",
};

export default async function PublicListeningPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: raw } = await params;
  const token = decodeURIComponent(raw ?? "").trim();

  if (!isListeningTokenShapeValid(token)) {
    return (
      <ListeningPublicError
        error={classifyListeningPublicError("listening_token_invalid")}
      />
    );
  }

  const resolved = await resolveListeningForToken(token);
  if (!resolved.ok) {
    return <ListeningPublicError error={resolved.error} />;
  }

  return <ListeningRespondentSurvey token={token} view={resolved.view} />;
}
