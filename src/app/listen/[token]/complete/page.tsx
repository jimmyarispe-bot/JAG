import type { Metadata } from "next";
import {
  ListeningCompleteClient,
  ListeningPublicError,
} from "@/components/listening-public";
import {
  classifyListeningPublicError,
  isListeningTokenShapeValid,
} from "@/lib/platform/listening";

export const metadata: Metadata = {
  title: "Listening · Thank you",
};

export default async function PublicListeningCompletePage({
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

  return <ListeningCompleteClient token={token} />;
}
