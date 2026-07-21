import { ConfigStudioShell } from "@/components/configuration/ConfigStudioShell";
import { ConfigSectionForm } from "@/components/configuration/ConfigSectionForm";
import { loadConfigPage } from "@/lib/configuration/page-data";
import { ActionChip } from "@/components/ui/cta";

export default async function CalendarsConfigPage() {
  const { organizationId, config } = await loadConfigPage("academic");

  return (
    <ConfigStudioShell title="Calendars" subtitle="School years, terms, and academic calendar configuration">
      <ConfigSectionForm
        sectionKey="academic"
        organizationId={organizationId}
        title="Academic calendar"
        config={config}
        fields={[
          { name: "timezone", label: "Calendar time zone", placeholder: "America/New_York" },
        ]}
      />
      <ActionChip href="/dashboard/scheduling" size="sm">
        Open scheduling module for session calendars
      </ActionChip>
    </ConfigStudioShell>
  );
}
