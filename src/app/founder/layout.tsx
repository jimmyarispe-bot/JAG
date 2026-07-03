import { redirect } from "next/navigation";
import { redirectIfPasswordResetRequired } from "@/lib/auth/must-reset-password";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";

export const metadata = {
  title: "Founder Operating Center™ | JAG",
  description:
    "Executive operating center for education leaders — calm, confident, and complete.",
};

export default async function FounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/founder");
  }

  redirectIfPasswordResetRequired(user, "/founder");

  const ctx = await getIdentityContext();
  if (!ctx) {
    redirect("/login?next=/founder");
  }

  return <>{children}</>;
}
