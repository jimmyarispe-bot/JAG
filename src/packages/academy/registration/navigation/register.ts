import { ACADEMYOS_NAVIGATION } from "@/applications/academyos/navigation/definition";
import { registerAcademyNavigation } from "@/applications/academyos/navigation";
import { registerPackageNavigation } from "@/jag/navigation";
import { ACADEMY_APPLICATION_ID } from "@/packages/academy/package";

export function registerAcademyPackageNavigation(): void {
  registerAcademyNavigation();
  registerPackageNavigation({
    id: ACADEMYOS_NAVIGATION.id,
    applicationId: ACADEMY_APPLICATION_ID,
    version: ACADEMYOS_NAVIGATION.version,
    items: ACADEMYOS_NAVIGATION.items,
  });
}
