import { ConfigStudioShell } from "@/components/configuration/ConfigStudioShell";
import { ConfigSectionForm, ConfigJsonPreview } from "@/components/configuration/ConfigSectionForm";
import { loadConfigPage } from "@/lib/configuration/page-data";

export default async function BrandingConfigPage() {
  const { organizationId, config } = await loadConfigPage("branding");

  return (
    <ConfigStudioShell title="Branding" subtitle="Product identity, logos, colors, and surface labels">
      <ConfigSectionForm
        sectionKey="branding"
        organizationId={organizationId}
        title="Product identity"
        description="Configure how your organization appears across staff, family, and admissions surfaces"
        config={config}
        fields={[
          { name: "product_name", label: "Product name", placeholder: "Defaults to organization legal name" },
          { name: "product_tagline", label: "Product tagline" },
          { name: "edition_label", label: "Edition label", placeholder: "e.g. Founder's Edition" },
          { name: "monogram", label: "Sidebar monogram (1 character)", placeholder: "Auto from product name" },
          { name: "email_from_name", label: "Email sender name" },
          { name: "logo_url", label: "Logo URL" },
          { name: "dark_logo_url", label: "Dark logo URL" },
          { name: "favicon_url", label: "Favicon URL" },
          { name: "primary_color", label: "Primary color", type: "color" },
          { name: "secondary_color", label: "Secondary color", type: "color" },
          { name: "accent_color", label: "Accent color", type: "color" },
        ]}
      />
      <ConfigSectionForm
        sectionKey="branding"
        organizationId={organizationId}
        title="Surface labels"
        description="Navigation and workspace labels shown to staff users"
        config={config}
        fields={[
          { name: "founder_workspace_label", label: "Founder workspace label" },
          { name: "intelligence_engine_label", label: "Intelligence engine label" },
          { name: "mission_control_label", label: "Mission control label" },
          { name: "compliance_label", label: "Compliance label" },
          { name: "financial_intelligence_label", label: "Financial intelligence label" },
          { name: "connect_label", label: "Connect / integrations label" },
          { name: "data_hub_label", label: "Data hub label" },
          { name: "support_mode_label", label: "Impersonation support mode label" },
        ]}
      />
      <ConfigJsonPreview config={config} />
    </ConfigStudioShell>
  );
}
