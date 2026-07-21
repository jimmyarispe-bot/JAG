import { ConfigStudioShell } from "@/components/configuration/ConfigStudioShell";
import { ConfigSectionForm, ConfigJsonPreview } from "@/components/configuration/ConfigSectionForm";
import { loadConfigPage } from "@/lib/configuration/page-data";
import { ActionChip, ActionChipGroup } from "@/components/ui/cta";

export default async function WorkflowsConfigPage() {
  const { organizationId, config } = await loadConfigPage("workflows");

  return (
    <ConfigStudioShell title="Workflow Studio" subtitle="Automation, approvals, deadlines, escalations, and Mission Control rules">
      <ConfigSectionForm sectionKey="workflows" organizationId={organizationId} title="Workflow rules" config={config} fields={[]} />
      <ConfigJsonPreview config={config} />
      <ActionChipGroup>
        <ActionChip href="/dashboard/automation/marketplace" size="sm">
          Workflow marketplace
        </ActionChip>
        <ActionChip href="/dashboard/compliance" size="sm">
          Compliance automations
        </ActionChip>
      </ActionChipGroup>
    </ConfigStudioShell>
  );
}
