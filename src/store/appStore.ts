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

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

const apiFetch = async (url: string, options: RequestInit = {}) => {
  const headers = getAuthHeaders();
  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
  if (res.status === 401 || res.status === 403) {
    useAuthStore.getState().logout();
  }
  return res;
};

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
  devotionalNotes: Record<string, string>;

  // Actions
  bootstrap: () => Promise<void>;
  reset: () => void;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
  addDonation: (donation: Omit<Donation, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  addPrayerRequest: (request: Omit<PrayerRequest, 'id' | 'createdAt' | 'prayerCount' | 'prayedByIds' | 'status'>) => Promise<void>;
  incrementPrayerCount: (prayerId: string, userId: string) => Promise<void>;
  updatePrayerPastoralNote: (prayerId: string, note: string) => Promise<void>;
  resolvePrayerRequest: (prayerId: string) => Promise<void>;
  addPastoralNote: (note: Omit<PastoralNote, 'id' | 'createdAt'>) => Promise<void>;
  addContent: (item: Omit<Content, 'id' | 'createdAt' | 'viewCount'>) => Promise<void>;
  addEvent: (item: Omit<Event, 'id' | 'createdAt' | 'attendeeIds' | 'reminderSent'>) => Promise<void>;
  toggleRSVP: (eventId: string, userId: string) => Promise<void>;
  toggleAttendance: (eventId: string, userId: string) => Promise<void>;
  addMessage: (conversationId: string, senderId: string, content: string) => Promise<void>;
  updateLiveStreamSettings: (updates: Partial<LiveStream>) => Promise<void>;
  updateOrganizationName: (name: string) => Promise<void>;
  updateThemeColor: (color: string) => Promise<void>;
  registerUser: (
    newUser: Omit<User, 'uid' | 'role' | 'status' | 'onboardingCompleted' | 'lastActiveAt' | 'createdAt' | 'privacySettings' | 'ministry' | 'groupIds'> & { password?: string },
    password?: string
  ) => Promise<boolean>;
  suspendUser: (userId: string) => Promise<void>;
  activateUser: (userId: string) => Promise<void>;
  changeUserRole: (userId: string, role: string) => Promise<void>;
  deleteContent: (contentId: string) => Promise<void>;
  updateContentItem: (contentId: string, updates: Partial<Content>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  updateEventItem: (eventId: string, updates: Partial<Event>) => Promise<void>;
  updateGroupDetails: (groupId: string, updates: Partial<Group>) => Promise<void>;
  fetchDevotionalNote: (contentId: string) => Promise<void>;
  saveDevotionalNote: (contentId: string, noteText: string) => Promise<void>;
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
      devotionalNotes: {},

      async bootstrap() {
        const token = useAuthStore.getState().token;
        if (!token) return;
        try {
          const res = await fetch('/api/bootstrap', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (res.status === 401 || res.status === 403) {
            useAuthStore.getState().logout();
            return;
          }
          if (res.ok) {
            const data = await res.json();
            set({
              users: data.users || [],
              groups: data.groups || [],
              content: data.content || [],
              prayerRequests: data.prayerRequests || [],
              events: data.events || [],
              pastoralNotes: data.pastoralNotes || [],
              donations: data.donations || [],
              messages: data.messages || [],
              liveStream: data.liveStream || {
                id: '',
                title: '',
                platform: 'youtube',
                streamUrl: '',
                chatEnabled: false,
                offeringEnabled: false,
                status: 'scheduled',
                viewerCount: 0,
                scheduledAt: '',
                createdAt: '',
              },
              notifications: data.notifications || [],
              organizationName: data.organizationName || 'Los Invisibles de Jesus',
              themeColor: data.themeColor || '#4F46E5',
            });
          }
        } catch (err) {
          console.error('Error during bootstrap:', err);
        }
      },
      reset() {
        set({
          users: [],
          groups: [],
          content: [],
          prayerRequests: [],
          events: [],
          pastoralNotes: [],
          donations: [],
          messages: [],
          liveStream: {
            id: '',
            title: '',
            platform: 'youtube',
            streamUrl: '',
            chatEnabled: false,
            offeringEnabled: false,
            status: 'scheduled',
            viewerCount: 0,
            scheduledAt: '',
            createdAt: '',
          },
          notifications: [],
          organizationName: 'Los Invisibles de Jesus',
          themeColor: '#4F46E5',
        });
      },
      async updateUserProfile(userId, updates) {
        const res = await apiFetch(`/api/users/${userId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            set((state) => {
              const updatedUsers = state.users.map((u) => (u.uid === userId ? data.user : u));
              const currentUser = useAuthStore.getState().user;
              if (currentUser && currentUser.uid === userId) {
                useAuthStore.setState({ user: data.user });
              }
              return { users: updatedUsers };
            });
          }
        }
      },
      async approveUser(userId) {
        const res = await apiFetch(`/api/users/${userId}/approve`, {
          method: 'POST',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
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
          }
        }
      },
      async toggleAttendance(eventId, userId) {
        const res = await apiFetch(`/api/events/${eventId}/attendance`, {
          method: 'POST',
          body: JSON.stringify({ userId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.event) {
            set((state) => ({
              events: state.events.map((e) => (e.id === eventId ? data.event : e)),
            }));
          }
        }
      },
      async addDonation(donation) {
        const res = await apiFetch('/api/donations', {
          method: 'POST',
          body: JSON.stringify(donation),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.donation) {
            set((state) => ({
              donations: [data.donation, ...state.donations],
            }));
          }
        }
      },
      async addPrayerRequest(request) {
        const res = await apiFetch('/api/prayer-requests', {
          method: 'POST',
          body: JSON.stringify(request),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.prayerRequest) {
            set((state) => ({
              prayerRequests: [data.prayerRequest, ...state.prayerRequests],
            }));
          }
        }
      },
      async incrementPrayerCount(prayerId, userId) {
        const res = await apiFetch(`/api/prayer-requests/${prayerId}/pray`, {
          method: 'POST',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.prayerRequest) {
            set((state) => ({
              prayerRequests: state.prayerRequests.map((p) =>
                p.id === prayerId ? data.prayerRequest : p
              ),
            }));
          }
        }
      },
      async updatePrayerPastoralNote(prayerId, note) {
        const res = await apiFetch(`/api/prayer-requests/${prayerId}/pastoral-note`, {
          method: 'PUT',
          body: JSON.stringify({ pastoralNote: note }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.prayerRequest) {
            set((state) => ({
              prayerRequests: state.prayerRequests.map((p) =>
                p.id === prayerId ? data.prayerRequest : p
              ),
            }));
          }
        }
      },
      async resolvePrayerRequest(prayerId) {
        const res = await apiFetch(`/api/prayer-requests/${prayerId}/resolve`, {
          method: 'POST',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.prayerRequest) {
            set((state) => ({
              prayerRequests: state.prayerRequests.map((p) =>
                p.id === prayerId ? data.prayerRequest : p
              ),
            }));
          }
        }
      },
      async addPastoralNote(note) {
        const res = await apiFetch('/api/pastoral-notes', {
          method: 'POST',
          body: JSON.stringify(note),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.pastoralNote) {
            set((state) => ({
              pastoralNotes: [data.pastoralNote, ...state.pastoralNotes],
            }));
          }
        }
      },
      async addContent(item) {
        const res = await apiFetch('/api/content', {
          method: 'POST',
          body: JSON.stringify(item),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.content) {
            set((state) => ({
              content: [data.content, ...state.content],
            }));
          }
        }
      },
      async addEvent(item) {
        const res = await apiFetch('/api/events', {
          method: 'POST',
          body: JSON.stringify(item),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.event) {
            set((state) => ({
              events: [data.event, ...state.events],
            }));
          }
        }
      },
      async toggleRSVP(eventId, userId) {
        const res = await apiFetch(`/api/events/${eventId}/rsvp`, {
          method: 'POST',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.event) {
            set((state) => ({
              events: state.events.map((e) => (e.id === eventId ? data.event : e)),
            }));
          }
        }
      },
      async addMessage(conversationId, senderId, content) {
        const res = await apiFetch('/api/messages', {
          method: 'POST',
          body: JSON.stringify({ conversationId, content, type: 'text' }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.message) {
            set((state) => ({
              messages: [...state.messages, data.message],
            }));
          }
        }
      },
      async updateLiveStreamSettings(updates) {
        const res = await apiFetch('/api/livestream', {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.liveStream) {
            set({ liveStream: data.liveStream });
          }
        }
      },
      async updateOrganizationName(name) {
        const res = await apiFetch('/api/config', {
          method: 'PUT',
          body: JSON.stringify({ organizationName: name }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.organizationName) {
            set({ organizationName: data.organizationName });
          }
        }
      },
      async updateThemeColor(color) {
        const res = await apiFetch('/api/config', {
          method: 'PUT',
          body: JSON.stringify({ themeColor: color }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.themeColor) {
            set({ themeColor: data.themeColor });
          }
        }
      },
      async registerUser(newUser, passwordParam) {
        const password = newUser.password || passwordParam;
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: newUser.email,
            password,
            displayName: newUser.displayName,
            city: newUser.city,
            country: newUser.country || 'Colombia',
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          return true;
        } else {
          throw new Error(data.error || 'Error al registrar');
        }
      },
      async suspendUser(userId) {
        const res = await apiFetch(`/api/users/${userId}/suspend`, {
          method: 'POST',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            set((state) => {
              const updatedUsers = state.users.map((u) => (u.uid === userId ? { ...u, status: 'suspended' as const } : u));
              const currentUser = useAuthStore.getState().user;
              if (currentUser && currentUser.uid === userId) {
                useAuthStore.setState({
                  user: { ...currentUser, status: 'suspended' }
                });
              }
              return { users: updatedUsers };
            });
          }
        }
      },
      async activateUser(userId) {
        const res = await apiFetch(`/api/users/${userId}/activate`, {
          method: 'POST',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
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
          }
        }
      },
      async changeUserRole(userId, role) {
        const res = await apiFetch(`/api/users/${userId}/role`, {
          method: 'PUT',
          body: JSON.stringify({ role }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            set((state) => {
              const updatedUsers = state.users.map((u) => (u.uid === userId ? { ...u, role: role as any } : u));
              const currentUser = useAuthStore.getState().user;
              if (currentUser && currentUser.uid === userId) {
                useAuthStore.setState({
                  user: { ...currentUser, role: role as any }
                });
              }
              return { users: updatedUsers };
            });
          }
        }
      },
      async deleteContent(contentId) {
        const res = await apiFetch(`/api/content/${contentId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            set((state) => ({
              content: state.content.filter((c) => c.id !== contentId),
            }));
          }
        }
      },
      async updateContentItem(contentId, updates) {
        const res = await apiFetch(`/api/content/${contentId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.content) {
            set((state) => ({
              content: state.content.map((c) => (c.id === contentId ? data.content : c)),
            }));
          }
        }
      },
      async deleteEvent(eventId) {
        const res = await apiFetch(`/api/events/${eventId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            set((state) => ({
              events: state.events.filter((e) => e.id !== eventId),
            }));
          }
        }
      },
      async updateEventItem(eventId, updates) {
        const res = await apiFetch(`/api/events/${eventId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.event) {
            set((state) => ({
              events: state.events.map((e) => (e.id === eventId ? data.event : e)),
            }));
          }
        }
      },
      async updateGroupDetails(groupId, updates) {
        const res = await apiFetch(`/api/groups/${groupId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.group) {
            set((state) => ({
              groups: state.groups.map((g) => (g.id === groupId ? data.group : g)),
            }));
          }
        }
      },
      async fetchDevotionalNote(contentId) {
        const res = await apiFetch(`/api/devotional-notes/${contentId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            set((state) => ({
              devotionalNotes: {
                ...state.devotionalNotes,
                [contentId]: data.noteText || '',
              },
            }));
          }
        }
      },
      async saveDevotionalNote(contentId, noteText) {
        const res = await apiFetch(`/api/devotional-notes/${contentId}`, {
          method: 'POST',
          body: JSON.stringify({ noteText }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            set((state) => ({
              devotionalNotes: {
                ...state.devotionalNotes,
                [contentId]: noteText,
              },
            }));
          }
        }
      },
    }),
    {
      name: 'congregacion-digital-data',
    },
  ),
);
