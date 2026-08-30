import { resolveParentInfoRequest } from "@/lib/people/parent-info-public";
import { ParentInfoForm } from "@/components/people/ParentInfoForm";

export const metadata = {
  title: "Update your details",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The page a parent lands on from the email. No account, no login.
 *
 * Every failure reads as a sentence a parent can act on. "parent_info_token_
 * invalid" is for the logs.
 */
export default async function ParentInfoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const view = await resolveParentInfoRequest(token);

  const shell = (title: string, body: string) => (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-3 text-slate-600">{body}</p>
    </main>
  );

  if (view.state === "completed") {
    return shell("Already received", "Thank you — these details are already with the school. There is nothing else to do.");
  }
  if (view.state === "expired") {
    return shell("This link has expired", "Links stay live for 30 days. Please contact the school and they will send a new one.");
  }
  if (view.state === "closed") {
    return shell("This link is closed", "Please contact the school if you still need to send these details.");
  }
  if (view.state === "invalid") {
    return shell("We could not open this link", "Please check the address in the email, or contact the school.");
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <p className="text-sm text-slate-500">{view.school}</p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">
        A few details we&rsquo;re missing
      </h1>
      <p className="mt-3 text-slate-600">
        These are the only things our records are short of for your family. Nothing else is
        shown or changed.
      </p>
      <ParentInfoForm token={token} requested={view.requested} />
      <p className="mt-10 text-xs text-slate-400">
        This link is just for your family and is not indexed or shared.
      </p>
    </main>
  );
}
