import type { IntelligenceDomainRegistry as Contract } from "@/lib/platform/oios/contracts";
import { defaultRegisteredDomains } from "@/lib/platform/oios/models";
import type { DomainDescriptor } from "@/lib/platform/oios/types";
export class IntelligenceDomainRegistry implements Contract {
  private readonly domains = new Map<DomainDescriptor["domain"], DomainDescriptor>();
  constructor(descriptors = defaultRegisteredDomains()) { descriptors.forEach((descriptor) => this.register(descriptor)); }
  register(descriptor: DomainDescriptor): DomainDescriptor { const copy = { ...descriptor, dependencies: [...descriptor.dependencies] }; this.domains.set(copy.domain, copy); return copy; }
  get(domain: DomainDescriptor["domain"]): DomainDescriptor | null { const value = this.domains.get(domain); return value ? { ...value, dependencies: [...value.dependencies] } : null; }
  list(): DomainDescriptor[] { return [...this.domains.values()].map((item) => ({ ...item, dependencies: [...item.dependencies] })); }
  activate(domain: DomainDescriptor["domain"]): DomainDescriptor | null { return this.update(domain, "active"); }
  deactivate(domain: DomainDescriptor["domain"]): DomainDescriptor | null { return this.update(domain, "dormant"); }
  resolveOrder(domains?: DomainDescriptor["domain"][]): DomainDescriptor[] { const selected = domains ?? this.list().map((item) => item.domain); const output: DomainDescriptor[] = []; const visiting = new Set<string>(); const visit = (domain: DomainDescriptor["domain"]) => { if (output.some((item) => item.domain === domain) || visiting.has(domain)) return; visiting.add(domain); const descriptor = this.domains.get(domain); descriptor?.dependencies.forEach(visit); if (descriptor) output.push({ ...descriptor, dependencies: [...descriptor.dependencies] }); visiting.delete(domain); }; selected.forEach(visit); return output; }
  private update(domain: DomainDescriptor["domain"], status: DomainDescriptor["status"]): DomainDescriptor | null { const value = this.domains.get(domain); return value ? this.register({ ...value, status }) : null; }
}
