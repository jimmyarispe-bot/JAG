export type MessageRecord = {
  id: string;
  displayName: string;
  body?: string | null;
  studentId?: string | null;
  familyId?: string | null;
  channel: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementRecord = {
  id: string;
  displayName: string;
  body?: string | null;
  schoolId?: string | null;
  audience: string;
  status: string;
  publishOn?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CommunicationsRepository = {
  saveMessage(record: MessageRecord): Promise<MessageRecord>;
  getMessage(id: string): Promise<MessageRecord | null>;
  saveAnnouncement(record: AnnouncementRecord): Promise<AnnouncementRecord>;
  getAnnouncement(id: string): Promise<AnnouncementRecord | null>;
};
