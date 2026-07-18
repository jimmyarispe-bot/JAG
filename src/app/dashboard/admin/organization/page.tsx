import { ConfigStudioShell } from "@/components/configuration/ConfigStudioShell";
import { ConfigSectionForm } from "@/components/configuration/ConfigSectionForm";
import { OrganizationHierarchyPanel } from "@/components/platform/admin/OrganizationHierarchyPanel";
import { getOrganizationHierarchy } from "@/lib/platform/identity/org";
import { loadConfigPage } from "@/lib/configuration/page-data";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function OrganizationAdminPage() {
  await requirePagePermission("org.view");

  const [{ organizationId, config }, hierarchy] = await Promise.all([
    loadConfigPage("organization"),
    getOrganizationHierarchy(),
  ]);

  return (
    <ConfigStudioShell title="Organization" subtitle="Legal profile, mission, vision, and hierarchy">
      <ConfigSectionForm
        sectionKey="organization"
        organizationId={organizationId}
        title="Organization profile"
        config={config}
        fields={[
          { name: "legal_name", label: "Legal name" },
          { name: "tax_id", label: "Tax ID" },
          { name: "website", label: "Website" },
          { name: "mission", label: "Mission", type: "textarea" },
          { name: "vision", label: "Vision", type: "textarea" },
          { name: "timezone", label: "Time zone" },
        ]}
      />
      <ConfigSectionForm
        sectionKey="organization"
        organizationId={organizationId}
        title="Executive role titles"
        description="Display titles for leadership roles — overrides system defaults"
        config={config}
        fields={[
          { name: "role_title_CEO", label: "CEO title", placeholder: "e.g. Founder / CEO" },
          { name: "role_title_FOUNDER", label: "Founder title", placeholder: "e.g. Founder" },
          { name: "role_title_EXECUTIVE_DIRECTOR", label: "Executive Director title" },
          { name: "role_title_REGIONAL_DIRECTOR", label: "Regional Director title" },
          { name: "role_title_SCHOOL_LEADER", label: "School Leader title", placeholder: "e.g. Superintendent" },
        ]}
      />
      <OrganizationHierarchyPanel hierarchy={hierarchy} />
    </ConfigStudioShell>
  );
}
