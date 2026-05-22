
// This file is now deprecated in favor of dynamic Firestore fetching.
// Keeping it for type references if needed, but not using static data.

export type Subject = {
  id: string;
  name: string;
  iconName: string;
  description: string;
  color: string;
};

export type Note = {
  id: string;
  title: string;
  subjectId: string;
  chapter: string;
  description: string;
  fileUrl: string;
  thumbnail: string;
  isPremium: boolean;
  premiumPassword?: string;
  uploadDate: string;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};
