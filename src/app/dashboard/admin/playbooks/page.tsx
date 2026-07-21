import { ConfigStudioShell } from "@/components/configuration/ConfigStudioShell";
import { ConfigSectionForm } from "@/components/configuration/ConfigSectionForm";
import { loadConfigPage } from "@/lib/configuration/page-data";
import { ActionChip } from "@/components/ui/cta";

export default async function PlaybooksConfigPage() {
  const { organizationId, config } = await loadConfigPage("playbooks");

  return (
    <ConfigStudioShell title="Playbooks" subtitle="Configure operational playbooks">
      <ConfigSectionForm sectionKey="playbooks" organizationId={organizationId} title="Playbook settings" config={config} fields={[{ name: "enabled", label: "Playbooks enabled", placeholder: "true" }]} />
      <ActionChip href="/dashboard/playbooks" size="sm">
        Open playbooks
      </ActionChip>
    </ConfigStudioShell>
  );
}
