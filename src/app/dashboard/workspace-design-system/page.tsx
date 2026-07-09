import { DesignSystemShowcase } from "@/components/workspace-design-system";
import { ExperienceSystemShowcase } from "@/components/experience-system";

export default function WorkspaceDesignSystemPage() {
  return (
    <div className="space-y-16">
      <ExperienceSystemShowcase />
      <DesignSystemShowcase />
    </div>
  );
}
