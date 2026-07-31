export type GuardianRecord = {
  id: string;
  displayName: string;
  email: string;
  phone?: string | null;
  familyId?: string | null;
  relationship: string;
  createdAt: string;
  updatedAt: string;
};

export type GuardianRepository = {
  getById(id: string): Promise<GuardianRecord | null>;
  listByFamily(familyId: string): Promise<GuardianRecord[]>;
  save(record: GuardianRecord): Promise<GuardianRecord>;
};
