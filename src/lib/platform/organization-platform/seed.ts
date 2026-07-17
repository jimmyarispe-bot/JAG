import type { OrganizationPlatformStore } from "./store";
import { OrganizationService, LocationService, UnitService } from "./services/hierarchy";
import { AuthService, SessionService, UserService } from "./services/users-auth";
import { resolveActor } from "./rbac";
import type { OrganizationPlatformRole } from "./types";

/**
 * Seed two isolated demo organizations for foundation validation.
 */
export function seedDemoOrganizations(store: OrganizationPlatformStore): {
  orgAId: string;
  orgBId: string;
  platformAdminId: string;
  ownerAId: string;
  ownerBId: string;
} {
  const orgs = new OrganizationService(store);
  const users = new UserService(store);
  const locations = new LocationService(store);
  const units = new UnitService(store);
  const auth = new AuthService(store);
  const sessions = new SessionService(store);

  const platformAdmin = users.createUser({
    email: "platform.admin@jag.local",
    fullName: "Platform Admin",
    password: "change-me-admin",
    authMethods: ["email_password", "magic_link", "google", "microsoft"],
  });

  const ownerA = users.createUser({
    email: "owner.a@acme.local",
    fullName: "Owner Alpha",
    password: "change-me-a",
    authMethods: ["email_password", "magic_link", "google"],
  });

  const ownerB = users.createUser({
    email: "owner.b@beta.local",
    fullName: "Owner Beta",
    password: "change-me-b",
    authMethods: ["email_password", "magic_link", "microsoft"],
  });

  // Bootstrap: create org A without actor (platform bootstrap), then attach memberships.
  const orgA = orgs.create({
    name: "Acme Education Group",
    slug: "acme-education",
    industry: "education",
    ownerUserId: ownerA.id,
  });
  const orgB = orgs.create({
    name: "Beta Learning Network",
    slug: "beta-learning",
    industry: "education",
    ownerUserId: ownerB.id,
  });

  addMembership(store, orgA.id, platformAdmin.id, "platform_admin");
  addMembership(store, orgB.id, platformAdmin.id, "platform_admin");
  addMembership(store, orgA.id, ownerA.id, "organization_owner");
  addMembership(store, orgB.id, ownerB.id, "organization_owner");

  const actorA = resolveActor(store, ownerA.id, orgA.id);
  const actorB = resolveActor(store, ownerB.id, orgB.id);

  const campusA = locations.create(
    {
      organizationId: orgA.id,
      kind: "campus",
      name: "Acme Main Campus",
      code: "ACME-MAIN",
      timezone: "America/New_York",
    },
    actorA
  );
  const schoolA = locations.create(
    {
      organizationId: orgA.id,
      kind: "school",
      name: "Acme Academy",
      code: "ACME-SCH",
      parentLocationId: campusA.id,
    },
    actorA
  );
  locations.create(
    {
      organizationId: orgB.id,
      kind: "campus",
      name: "Beta West Campus",
      code: "BETA-WEST",
      timezone: "America/Los_Angeles",
    },
    actorB
  );

  units.create(
    {
      organizationId: orgA.id,
      kind: "department",
      name: "Academics",
      locationId: schoolA.id,
    },
    actorA
  );
  units.create(
    {
      organizationId: orgA.id,
      kind: "team",
      name: "Admissions Team",
      locationId: schoolA.id,
    },
    actorA
  );
  units.create(
    {
      organizationId: orgB.id,
      kind: "department",
      name: "Operations",
    },
    actorB
  );

  // Warm sessions for demo owners
  sessions.create(ownerA.id, "email_password", orgA.id);
  sessions.create(ownerB.id, "email_password", orgB.id);
  void auth;

  return {
    orgAId: orgA.id,
    orgBId: orgB.id,
    platformAdminId: platformAdmin.id,
    ownerAId: ownerA.id,
    ownerBId: ownerB.id,
  };
}

function addMembership(
  store: OrganizationPlatformStore,
  organizationId: string,
  userId: string,
  role: OrganizationPlatformRole
): void {
  const id = store.createId("mem");
  store.memberships.set(id, {
    id,
    organizationId,
    userId,
    role,
    locationIds: [],
    departmentIds: [],
    teamIds: [],
    status: "active",
    invitedAt: new Date().toISOString(),
    joinedAt: new Date().toISOString(),
  });
}
