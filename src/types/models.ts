export type Role = 'super_admin' | 'admin' | 'leader' | 'member' | 'visitor';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type SpiritualStatus =
  | 'new_believer'
  | 'growing'
  | 'established'
  | 'leader_in_training';

export interface PrivacySettings {
  showPhone: boolean;
  showEmail: boolean;
  showCity: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: Role;
  phone: string;
  city: string;
  country: string;
  birthDate?: string;
  baptismDate?: string;
  favoriteVerse?: string;
  testimony?: string;
  ministry: string[];
  groupIds: string[];
  leaderId?: string;
  status: UserStatus;
  spiritualStatus: SpiritualStatus;
  privacySettings: PrivacySettings;
  onboardingCompleted: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export type GroupType =
  | 'cell'
  | 'ministry'
  | 'bible_study'
  | 'youth'
  | 'couples'
  | 'women'
  | 'men';

export type MeetingFormat = 'in_person' | 'virtual' | 'hybrid';

export interface Group {
  id: string;
  name: string;
  description: string;
  type: GroupType;
  leaderId: string;
  coLeaderIds: string[];
  memberIds: string[];
  maxCapacity: number;
  meetingDay: string;
  meetingTime: string;
  meetingFormat: MeetingFormat;
  meetingLocation?: string;
  meetingLink?: string;
  isPublic: boolean;
  coverImage?: string;
  createdAt: string;
}

export type ContentType = 'sermon' | 'devotional' | 'post' | 'announcement';
export type ContentVisibility = 'public' | 'members' | 'leaders' | 'admin';

export interface Content {
  id: string;
  type: ContentType;
  title: string;
  body: string;
  excerpt: string;
  coverImage?: string;
  audioUrl?: string;
  videoUrl?: string;
  authorId: string;
  series?: string;
  tags: string[];
  bibleReference?: string;
  visibility: ContentVisibility;
  publishedAt?: string;
  scheduledAt?: string;
  isDraft: boolean;
  viewCount: number;
  createdAt: string;
}

export type PrayerVisibility = 'public' | 'group' | 'private';
export type PrayerStatus = 'active' | 'answered' | 'closed';

export interface PrayerRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  visibility: PrayerVisibility;
  groupId?: string;
  status: PrayerStatus;
  prayerCount: number;
  prayedByIds: string[];
  pastoralNote?: string;
  answeredAt?: string;
  createdAt: string;
}

export type EventType =
  | 'service'
  | 'cell'
  | 'retreat'
  | 'conference'
  | 'social'
  | 'training';

export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  format: MeetingFormat;
  location?: string;
  virtualLink?: string;
  coverImage?: string;
  startDateTime: string;
  endDateTime: string;
  organizerId: string;
  targetGroupIds: string[];
  capacity?: number;
  requiresRSVP: boolean;
  rsvpDeadline?: string;
  attendeeIds: string[];
  reminderSent: boolean;
  createdAt: string;
}

export type PastoralNoteType = 'visit' | 'call' | 'message' | 'meeting' | 'observation';
export type MemberPastoralStatus =
  | 'new'
  | 'integrating'
  | 'active'
  | 'inactive'
  | 'crisis'
  | 'restoration';

export interface PastoralNote {
  id: string;
  memberId: string;
  leaderId: string;
  type: PastoralNoteType;
  content: string;
  followUpDate?: string;
  memberStatus: MemberPastoralStatus;
  isPrivate: boolean;
  createdAt: string;
}

export type DonationFund = 'tithe' | 'offering' | 'missions' | 'building' | 'social';
export type DonationMethod = 'card' | 'pse' | 'transfer' | 'cash';
export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly';
export type PaymentStatus = 'completed' | 'pending' | 'failed';

export interface Donation {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  fund: DonationFund;
  method: DonationMethod;
  stripePaymentId?: string;
  receiptUrl?: string;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  status: PaymentStatus;
  createdAt: string;
}

export type StreamPlatform = 'youtube' | 'facebook' | 'internal';
export type StreamStatus = 'scheduled' | 'live' | 'ended';

export interface LiveStream {
  id: string;
  title: string;
  platform: StreamPlatform;
  streamUrl: string;
  chatEnabled: boolean;
  offeringEnabled: boolean;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  status: StreamStatus;
  viewerCount: number;
  recordingUrl?: string;
  createdAt: string;
}

export type MessageType = 'text' | 'image' | 'audio' | 'file';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  fileUrl?: string;
  readBy: string[];
  isPinned: boolean;
  createdAt: string;
}

export type NotificationType = 'urgent' | 'important' | 'informational';
export type NotificationCategory =
  | 'prayer'
  | 'event'
  | 'message'
  | 'group'
  | 'content'
  | 'pastoral'
  | 'finance';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  category: NotificationCategory;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}
