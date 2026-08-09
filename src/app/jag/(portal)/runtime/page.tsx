import { JagPlaceholderPage } from "@/components/jag/command-center";
import { requireJagPlatformAdminSession } from "@/lib/jag-platform/admin-access";

export default async function JagRuntimePage() {
  await requireJagPlatformAdminSession();
  return (
    <JagPlaceholderPage
      title="Runtime"
      description="Jag Runtime lifecycle and session binding for the Command Center. No persistent runtime is attached to this UI yet."
    />
  );
}
