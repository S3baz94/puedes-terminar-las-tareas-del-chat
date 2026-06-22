# Handoff Report: Integrating appStore.ts with Express API Endpoints

This report provides the detailed analysis, logic chain, design decisions, and implementation plan for migrating `src/store/appStore.ts` from local mock data state operations to asynchronous REST API requests synchronized with the Express backend (`server/index.js`).

---

## 1. Observation

Based on file analysis, the following observations were made:

### A. Current State Initialization (`src/store/appStore.ts`)
The store currently loads static mock data directly upon initialization:
- **Line 1-15**: Imports mock data.
```typescript
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
```
- **Line 66-78**: Initializes store fields with mock data:
```typescript
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
```

### B. Express Server API Endpoints (`server/index.js`)
The backend provides endpoints mapped directly to the local store entities:
1. **Bootstrap Endpoint (`GET /api/bootstrap`)** (Lines 250-281):
   Reads all DB tables (users, groups, content, prayer requests, events, pastoral notes, donations, messages, livestream config, notifications, custom configs) and formats them into a single response object.
2. **User Registration (`POST /api/auth/register`)** (Lines 185-212):
   Accepts `{ email, password, displayName, city, country }`, inserts a pending user.
3. **User Approval (`POST /api/users/:uid/approve`)** (Lines 283-296):
   Sets user status to `'active'`.
4. **User Profile Update (`PUT /api/users/:uid`)** (Lines 298-405):
   Updates user fields and group memberships.
5. **Add Donation (`POST /api/donations`)** (Lines 407-439):
   Inserts donation record.
6. **Add Prayer Request (`POST /api/prayer-requests`)** (Lines 441-461):
   Inserts prayer request.
7. **Add Pastoral Note (`POST /api/pastoral-notes`)** (Lines 536-556):
   Inserts pastoral note.
8. **Add Content (`POST /api/content`)** (Lines 558-613):
   Inserts sermon/content record.
9. **Add Message (`POST /api/messages`)** (Lines 729-749):
   Inserts message in conversation.
10. **Update Livestream (`PUT /api/livestream`)** (Lines 751-808):
    Updates livestream configuration.
11. **Update Configurations (`PUT /api/config` & `PUT /api/organization`)** (Lines 810-839):
    Updates settings like `organizationName` and `themeColor`.

---

## 2. Logic Chain

1. **State Cleanliness**: Because records should originate from the database, the local Zustand store should initialize with empty arrays and default settings rather than hardcoded mock data.
2. **Bootstrapping Trigger**:
   - The `/api/bootstrap` endpoint requires a valid JWT token.
   - When a user logs in successfully via `useAuthStore.getState().login(email, password)` (calling `/api/auth/login`), the backend returns a JWT token.
   - We must extend `AuthState` to store this token (and include it in `localStorage` persistence).
   - Upon successful login, the application must invoke `useAppStore.getState().bootstrap(token)` to fetch all records and populate the store state.
3. **Circular Dependencies**: `appStore.ts` imports `useAuthStore` and vice versa. Since actions are evaluated lazily at execution time, this circular import is safe for runtime execution. To keep request headers clean, we can define a lazy-evaluation header builder helper:
   ```typescript
   const getHeaders = () => {
     const token = useAuthStore.getState().token;
     return {
       'Content-Type': 'application/json',
       ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
     };
   };
   ```
4. **Action Redesign Pattern**:
   Each mutation action should transition from synchronous local mutations to asynchronous API calls:
   - Call `fetch` (or `axios`) to target the respective backend endpoint.
   - Send the payload as JSON in the request body.
   - Validate response status (`ok` / `success: true`).
   - Use `set(...)` with the backend-returned entity to update/insert into local store arrays, maintaining local UI responsiveness.

---

## 3. Caveats

- **Token Storage**: `useAuthStore`'s `partialize` configuration must be modified to persist both the `user` and the `token`. Otherwise, on page refresh, the token will be lost and subsequent API requests (including bootstrapping) will fail with `401 Unauthorized`.
- **Zustand Persist Middleware**: If `useAppStore` continues using the `persist` middleware, it might write stale data to local storage. It is recommended to either:
  1. Disable persistence for `useAppStore` (relying fully on bootstrapping after authentication).
  2. Clear state on logout to prevent other users from seeing cached state in localStorage.
- **Asynchronous Error Handling**: Actions must be changed to `async` functions returning a `Promise` or throwing errors. UI components must be updated to handle loading/error states during mutations (e.g. showing a loading spinner while submitting a prayer request).

---

## 4. Conclusion & Design Proposal

To implement these changes, the following modifications should be applied:

### A. Updating `src/store/authStore.ts`
Modify the `AuthState` interface to include `token`, retrieve it from the login API call, and trigger `bootstrap`.

```typescript
// Proposed updates in src/store/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null; // Added
  status: AuthStatus;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  completeOnboarding: (details?: {
    phone: string;
    favoriteVerse: string;
    testimony: string;
    privacySettings: PrivacySettings;
  }) => Promise<boolean>; // Made async
}

// Inside authStore creation:
      token: null,
      async login(email, password) {
        set({ status: 'loading', error: null });
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await response.json();
          if (!response.ok || !data.success) {
            set({ status: 'error', error: data.error || 'Credenciales invalidas' });
            return false;
          }
          set({ user: data.user, token: data.token, status: 'authenticated', error: null });
          
          // Bootstrap appStore with the fresh token
          await useAppStore.getState().bootstrap(data.token);
          return true;
        } catch (err: any) {
          set({ status: 'error', error: err.message || 'Error de conexion' });
          return false;
        }
      },
      logout() {
        set({ user: null, token: null, status: 'idle', error: null });
        // Clear appStore state on logout
        useAppStore.getState().clearState();
      },
```

### B. Updating `src/store/appStore.ts`
Rewrite the state structure and action implementation to target REST endpoints.

```typescript
// Proposed updates in src/store/appStore.ts
import { create } from 'zustand';
import { useAuthStore } from './authStore';
import type { User, Group, Content, PrayerRequest, Event, PastoralNote, Donation, LiveStream, Message, AppNotification } from '../types/models';

const API_URL = '/api';

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
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
  liveStream: LiveStream | null;
  notifications: AppNotification[];
  organizationName: string;
  themeColor: string;

  // Sync actions
  bootstrap: (token: string) => Promise<void>;
  clearState: () => void;
  registerUser: (newUser: Omit<User, 'uid' | 'role' | 'status' | 'onboardingCompleted' | 'lastActiveAt' | 'createdAt' | 'privacySettings' | 'ministry' | 'groupIds'> & { password?: string }) => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<void>;
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
}

export const useAppStore = create<AppState>((set) => ({
  // Initialize with empty states (with sensible fallbacks)
  users: [],
  groups: [],
  content: [],
  prayerRequests: [],
  events: [],
  pastoralNotes: [],
  donations: [],
  messages: [],
  liveStream: null,
  notifications: [],
  organizationName: 'Los Invisibles de Jesus',
  themeColor: '#4F46E5',

  clearState() {
    set({
      users: [],
      groups: [],
      content: [],
      prayerRequests: [],
      events: [],
      pastoralNotes: [],
      donations: [],
      messages: [],
      liveStream: null,
      notifications: [],
    });
  },

  async bootstrap(token) {
    try {
      const response = await fetch(`${API_URL}/bootstrap`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Bootstrap failed');
      const data = await response.json();
      set({
        users: data.users,
        groups: data.groups,
        content: data.content,
        prayerRequests: data.prayerRequests,
        events: data.events,
        pastoralNotes: data.pastoralNotes,
        donations: data.donations,
        messages: data.messages,
        liveStream: data.liveStream,
        notifications: data.notifications,
        organizationName: data.organizationName,
        themeColor: data.themeColor,
      });
    } catch (err) {
      console.error('App bootstrap error:', err);
      throw err;
    }
  },

  async registerUser(newUser) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Registration failed');
    }
  },

  async approveUser(userId) {
    const response = await fetch(`${API_URL}/users/${userId}/approve`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Approval failed');
    }
    set((state) => ({
      users: state.users.map((u) => (u.uid === userId ? { ...u, status: 'active' } : u)),
    }));
  },

  async updateUserProfile(userId, updates) {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Profile update failed');
    }
    set((state) => ({
      users: state.users.map((u) => (u.uid === userId ? data.user : u)),
    }));
  },

  async addDonation(donation) {
    const response = await fetch(`${API_URL}/donations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(donation),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Donation submission failed');
    }
    set((state) => ({
      donations: [data.donation, ...state.donations],
    }));
  },

  async addPrayerRequest(request) {
    const response = await fetch(`${API_URL}/prayer-requests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Prayer request submission failed');
    }
    set((state) => ({
      prayerRequests: [data.prayerRequest, ...state.prayerRequests],
    }));
  },

  async incrementPrayerCount(prayerId, userId) {
    const response = await fetch(`${API_URL}/prayer-requests/${prayerId}/pray`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to update prayer count');
    }
    set((state) => ({
      prayerRequests: state.prayerRequests.map((p) => (p.id === prayerId ? data.prayerRequest : p)),
    }));
  },

  async updatePrayerPastoralNote(prayerId, note) {
    const response = await fetch(`${API_URL}/prayer-requests/${prayerId}/pastoral-note`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ pastoralNote: note }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to update pastoral note');
    }
    set((state) => ({
      prayerRequests: state.prayerRequests.map((p) => (p.id === prayerId ? data.prayerRequest : p)),
    }));
  },

  async resolvePrayerRequest(prayerId) {
    const response = await fetch(`${API_URL}/prayer-requests/${prayerId}/resolve`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to resolve prayer request');
    }
    set((state) => ({
      prayerRequests: state.prayerRequests.map((p) => (p.id === prayerId ? data.prayerRequest : p)),
    }));
  },

  async addPastoralNote(note) {
    const response = await fetch(`${API_URL}/pastoral-notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(note),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to add pastoral note');
    }
    set((state) => ({
      pastoralNotes: [data.pastoralNote, ...state.pastoralNotes],
    }));
  },

  async addContent(item) {
    const response = await fetch(`${API_URL}/content`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to add content');
    }
    set((state) => ({
      content: [data.content, ...state.content],
    }));
  },

  async addEvent(item) {
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to add event');
    }
    set((state) => ({
      events: [data.event, ...state.events],
    }));
  },

  async toggleRSVP(eventId, userId) {
    const response = await fetch(`${API_URL}/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to RSVP');
    }
    set((state) => ({
      events: state.events.map((e) => (e.id === eventId ? data.event : e)),
    }));
  },

  async toggleAttendance(eventId, userId) {
    const response = await fetch(`${API_URL}/events/${eventId}/attendance`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to toggle attendance');
    }
    set((state) => ({
      events: state.events.map((e) => (e.id === eventId ? data.event : e)),
    }));
  },

  async addMessage(conversationId, senderId, content) {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ conversationId, content, type: 'text' }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to send message');
    }
    set((state) => ({
      messages: [...state.messages, data.message],
    }));
  },

  async updateLiveStreamSettings(updates) {
    const response = await fetch(`${API_URL}/livestream`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to update livestream settings');
    }
    set({ liveStream: data.liveStream });
  },

  async updateOrganizationName(name) {
    const response = await fetch(`${API_URL}/config`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ organizationName: name }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to update organization name');
    }
    set({
      organizationName: data.organizationName,
      themeColor: data.themeColor,
    });
  },

  async updateThemeColor(color) {
    const response = await fetch(`${API_URL}/config`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ themeColor: color }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to update theme color');
    }
    set({
      organizationName: data.organizationName,
      themeColor: data.themeColor,
    });
  },
}));
```

---

## 5. Verification Method

To verify these design suggestions after integration:
1. **Mock Backend Interaction**:
   Use a test suite (like Vitest or Jest) to mock the global `fetch` API.
   Verify that when calling `useAppStore.getState().bootstrap('mock-token')`, `fetch` is triggered exactly once with `GET /api/bootstrap` and headers `Authorization: Bearer mock-token`.
2. **Payload/Response Verification**:
   Write a validation script (e.g. `verification/test_stores.js`) running in Node.js to trigger the rewritten store methods against a running instances of `server/index.js` and verify:
   - Registration writes a database record.
   - Mutations return `200 OK` or `201 Created` with expected structures.
   - Network payload structures exactly match database schema format helpers (`formatUser`, `formatPrayerRequest`, etc.).
3. **Invalidation conditions**:
   Verify that if the backend is down or returns `401 Unauthorized`, the store actions catch the error, log/bubble it, and keep the local state un-corrupted.
