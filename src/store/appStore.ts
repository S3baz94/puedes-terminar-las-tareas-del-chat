import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';
import {
  mockUsers,
  mockGroups,
  mockContent,
  mockPrayerRequests,
  mockEvents,
  mockPastoralNotes,
  mockDonations,
  mockLiveStream,
  mockMessages,
  mockNotifications,
} from '../constants/mockData';
import type {
  User,
  Group,
  Content,
  PrayerRequest,
  Event,
  PastoralNote,
  Donation,
  LiveStream,
  Message,
  AppNotification,
} from '../types/models';

interface AppState {
  users: User[];
  groups: Group[];
  content: Content[];
  prayerRequests: PrayerRequest[];
  events: Event[];
  pastoralNotes: PastoralNote[];
  donations: Donation[];
  messages: Message[];
  liveStream: LiveStream;
  notifications: AppNotification[];
  organizationName: string;

  themeColor: string;

  // Actions
  updateUserProfile: (userId: string, updates: Partial<User>) => void;
  approveUser: (userId: string) => void;
  addDonation: (donation: Omit<Donation, 'id' | 'createdAt' | 'status'>) => void;
  addPrayerRequest: (request: Omit<PrayerRequest, 'id' | 'createdAt' | 'prayerCount' | 'prayedByIds' | 'status'>) => void;
  incrementPrayerCount: (prayerId: string, userId: string) => void;
  updatePrayerPastoralNote: (prayerId: string, note: string) => void;
  resolvePrayerRequest: (prayerId: string) => void;
  addPastoralNote: (note: Omit<PastoralNote, 'id' | 'createdAt'>) => void;
  addContent: (item: Omit<Content, 'id' | 'createdAt' | 'viewCount'>) => void;
  addEvent: (item: Omit<Event, 'id' | 'createdAt' | 'attendeeIds' | 'reminderSent'>) => void;
  toggleRSVP: (eventId: string, userId: string) => void;
  toggleAttendance: (eventId: string, userId: string) => void;
  addMessage: (conversationId: string, senderId: string, content: string) => void;
  updateLiveStreamSettings: (updates: Partial<LiveStream>) => void;
  updateOrganizationName: (name: string) => void;
  updateThemeColor: (color: string) => void;
  registerUser: (newUser: Omit<User, 'uid' | 'role' | 'status' | 'onboardingCompleted' | 'lastActiveAt' | 'createdAt' | 'privacySettings' | 'ministry' | 'groupIds'>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      users: mockUsers,
      groups: mockGroups,
      content: mockContent,
      prayerRequests: mockPrayerRequests,
      events: mockEvents,
      pastoralNotes: mockPastoralNotes,
      donations: mockDonations,
      messages: mockMessages,
      liveStream: mockLiveStream,
      notifications: mockNotifications,
      organizationName: 'Los Invisibles de Jesus',
      themeColor: '#4F46E5',

      updateUserProfile(userId, updates) {
        set((state) => {
          const updatedUsers = state.users.map((u) => (u.uid === userId ? { ...u, ...updates } : u));
          
          const currentUser = useAuthStore.getState().user;
          if (currentUser && currentUser.uid === userId) {
            useAuthStore.setState({
              user: { ...currentUser, ...updates }
            });
          }

          return { users: updatedUsers };
        });
      },
      approveUser(userId) {
        set((state) => {
          const updatedUsers = state.users.map((u) => (u.uid === userId ? { ...u, status: 'active' as const } : u));
          
          const currentUser = useAuthStore.getState().user;
          if (currentUser && currentUser.uid === userId) {
            useAuthStore.setState({
              user: { ...currentUser, status: 'active' }
            });
          }

          return { users: updatedUsers };
        });
      },
      toggleAttendance(eventId, userId) {
        set((state) => ({
          events: state.events.map((e) => {
            if (e.id === eventId) {
              const isPresent = e.attendeeIds.includes(userId);
              return {
                ...e,
                attendeeIds: isPresent
                  ? e.attendeeIds.filter((id) => id !== userId)
                  : [...e.attendeeIds, userId],
              };
            }
            return e;
          }),
        }));
      },
      addDonation(donation) {
        const newDonation: Donation = {
          ...donation,
          id: `d-${Date.now()}`,
          status: 'completed',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          donations: [newDonation, ...state.donations],
        }));
      },
      addPrayerRequest(request) {
        const newRequest: PrayerRequest = {
          ...request,
          id: `p-${Date.now()}`,
          status: 'active',
          prayerCount: 0,
          prayedByIds: [],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          prayerRequests: [newRequest, ...state.prayerRequests],
        }));
      },
      incrementPrayerCount(prayerId, userId) {
        set((state) => ({
          prayerRequests: state.prayerRequests.map((p) => {
            if (p.id === prayerId) {
              const alreadyPrayed = p.prayedByIds.includes(userId);
              const prayedByIds = alreadyPrayed
                ? p.prayedByIds.filter((id) => id !== userId)
                : [...p.prayedByIds, userId];
              return {
                ...p,
                prayerCount: p.prayerCount + (alreadyPrayed ? -1 : 1),
                prayedByIds,
              };
            }
            return p;
          }),
        }));
      },
      updatePrayerPastoralNote(prayerId, note) {
        set((state) => ({
          prayerRequests: state.prayerRequests.map((p) =>
            p.id === prayerId ? { ...p, pastoralNote: note } : p,
          ),
        }));
      },
      resolvePrayerRequest(prayerId) {
        set((state) => ({
          prayerRequests: state.prayerRequests.map((p) =>
            p.id === prayerId ? { ...p, status: 'answered', answeredAt: new Date().toISOString() } : p,
          ),
        }));
      },
      addPastoralNote(note) {
        const newNote: PastoralNote = {
          ...note,
          id: `n-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          pastoralNotes: [newNote, ...state.pastoralNotes],
        }));
      },
      addContent(item) {
        const newContent: Content = {
          ...item,
          id: `c-${Date.now()}`,
          viewCount: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          content: [newContent, ...state.content],
        }));
      },
      addEvent(item) {
        const newEvent: Event = {
          ...item,
          id: `e-${Date.now()}`,
          attendeeIds: [],
          reminderSent: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          events: [newEvent, ...state.events],
        }));
      },
      toggleRSVP(eventId, userId) {
        set((state) => ({
          events: state.events.map((e) => {
            if (e.id === eventId) {
              const registered = e.attendeeIds.includes(userId);
              return {
                ...e,
                attendeeIds: registered
                  ? e.attendeeIds.filter((id) => id !== userId)
                  : [...e.attendeeIds, userId],
              };
            }
            return e;
          }),
        }));
      },
      addMessage(conversationId, senderId, content) {
        const newMessage: Message = {
          id: `m-${Date.now()}`,
          conversationId,
          senderId,
          content,
          type: 'text',
          readBy: [],
          isPinned: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      },
      updateLiveStreamSettings(updates) {
        set((state) => ({
          liveStream: { ...state.liveStream, ...updates },
        }));
      },
      updateOrganizationName(name) {
        set({ organizationName: name });
      },
      updateThemeColor(color) {
        set({ themeColor: color });
      },
      registerUser(newUser) {
        set((state) => {
          const registeredUser: User = {
            ...newUser,
            uid: `u-${Date.now()}`,
            role: 'member',
            status: 'pending',
            onboardingCompleted: false,
            privacySettings: {
              showPhone: false,
              showEmail: true,
              showCity: true,
            },
            ministry: [],
            groupIds: [],
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
          };
          return {
            users: [...state.users, registeredUser],
          };
        });
      },
    }),
    {
      name: 'congregacion-digital-data',
    },
  ),
);
