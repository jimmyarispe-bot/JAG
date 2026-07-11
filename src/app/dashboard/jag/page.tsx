import { ExecutiveWorkspace } from "@/components/jag/ExecutiveWorkspace";
import { loadExecutiveWorkspace } from "@/lib/platform/jag/workspace";

export const dynamic = "force-dynamic";

export default async function JagExecutiveWorkspacePage() {
  const data = await loadExecutiveWorkspace();
  return <ExecutiveWorkspace data={data} />;
}
