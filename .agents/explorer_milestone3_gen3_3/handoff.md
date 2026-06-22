# Handoff Report: Client-Side API Integration & Type Safety

## 1. Observation

During the read-only investigation, the following files and code snippets were examined:

### A. Auth Store (`src/store/authStore.ts`)
*   **State Interface (Lines 9-21)**: The store currently holds only the `user` object, `status`, and `error` state. It lacks a `token` property:
    ```typescript
    interface AuthState {
      user: User | null;
      status: AuthStatus;
      error: string | null;
      login: (email: string, password: string) => Promise<boolean>;
      logout: () => void;
      // ...
    }
    ```
*   **State Persistence (Lines 75-78)**: The partialize config only persists the `user`:
    ```typescript
    {
      name: 'congregacion-digital-auth',
      partialize: (state) => ({ user: state.user }),
    }
    ```

### B. SQLite Database Relational Schemas (`server/database.js`)
*   **Booleans mapped to SQLite Integers**: Flags like `onboardingCompleted` (users table, line 58), `isPublic` (groups table, line 76), `isDraft` (content table, line 109), `requiresRSVP` (events table, line 147), and `isPrivate` (pastoral_notes table, line 174) are stored as `INTEGER` and checked for `(0, 1)`.
*   **Arrays/Objects stored as JSON text**: Columns like `users.ministry` (line 53), `users.privacySettings` (line 57), and `content.tags` (line 104) are declared as `TEXT` and seeded using `JSON.stringify()`.
*   **Relational Join Tables**: Relational lists such as `groupIds` (users), `memberIds` & `coLeaderIds` (groups), `prayedByIds` (prayer requests), `targetGroupIds` & `attendeeIds` (events), and `readBy` (messages) are resolved via join tables rather than inline columns.

### C. Server Formatting & Interception (`server/index.js`)
*   **Express response formatting**: The API server implements helper functions like `formatUser` (lines 17-32) that parse JSON strings, convert integers to booleans, and inject relation arrays:
    ```javascript
    function formatUser(row) {
      if (!row) return null;
      const groupIds = db.prepare('SELECT groupId FROM group_members WHERE userId = ?').all(row.uid).map(r => r.groupId);
      const user = { ...row };
      delete user.passwordHash;
      return {
        ...user,
        ministry: row.ministry ? JSON.parse(row.ministry) : [],
        privacySettings: row.privacySettings ? JSON.parse(row.privacySettings) : { showPhone: false, showEmail: true, showCity: true },
        onboardingCompleted: row.onboardingCompleted === 1,
        groupIds
      };
    }
    ```
*   **Authentication & Status Codes (Lines 121-133)**: Missing tokens yield a `401 Unauthorized` with `{ success: false, error: 'No token provided' }`, while invalid or expired tokens yield a `403 Forbidden` with `{ success: false, error: 'Invalid or expired token' }`.

### D. Compilation Type-Safety Error (`src/store/appStore.ts`)
Running `npm run typecheck` fails with the following compiler error:
```
src/store/appStore.ts:160:11 - error TS2739: Type '{ id: string; title: string; platform: "youtube"; streamUrl: string; chatEnabled: false; offeringEnabled: false; status: "scheduled"; viewerCount: number; }' is missing the following properties from type 'LiveStream': scheduledAt, createdAt
```
This points to lines 131–139 in `src/store/appStore.ts` where `liveStream` is bootstrapped with a fallback object missing the required `scheduledAt` and `createdAt` properties:
```typescript
liveStream: data.liveStream || {
  id: '',
  title: '',
  platform: 'youtube',
  streamUrl: '',
  chatEnabled: false,
  offeringEnabled: false,
  status: 'scheduled',
  viewerCount: 0,
  // MISSING: scheduledAt, createdAt
}
```

---

## 2. Logic Chain

1.  **Token Synchronization**: To authenticate requests, `useAuthStore` must store and persist the returned JWT token. A fetch-based API client can then retrieve it dynamically via `useAuthStore.getState().token`.
2.  **Intercepting Expired/Invalid Tokens**: Since missing or invalid tokens return `401` or specific `403` status codes (Observation C), the client must intercept these statuses. Upon interception, calling `useAuthStore.getState().logout()` clears the state.
3.  **Automatic Navigation Redirects**: React-router's routing is controlled by `PrivateRoute.tsx`, which uses the `useAuth` hook. When the auth store's `user` becomes null, `useAuth().user` becomes null, triggering an automatic UI redirect to `/login`.
4.  **Client-Side Type Mapping**: Relational databases representation of arrays and booleans (Observation B) doesn't match client TypeScript interfaces directly. Creating defensive deserialization mappers on the client guarantees type safety and compilation verification regardless of database representation.
5.  **Store Modernization**: Mutating state locally in `useAppStore` leads to state drift. Migrating store methods to be async and calling the API ensures database-store synchronization.
6.  **Fixing TypeScript Compilation**: The type error on `liveStream` in `appStore.ts` is caused by a missing fallback implementation. Adding `scheduledAt` and `createdAt` strings (e.g., empty strings or current timestamps) satisfies the `LiveStream` interface contract.

---

## 3. Caveats

*   **API URL Setup**: The API client wrapper depends on `import.meta.env.VITE_API_URL`. Ensure this env variable is set in production.
*   **403 Interception Scope**: A `403 Forbidden` status code can also represent an authorized user attempting to perform an action above their role permissions. The interceptor should only trigger a logout if the response body contains the specific error message: `'Invalid or expired token'`.

---

## 4. Conclusion & Recommendations

### A. Fix for Type-Safety Compilation Error (`src/store/appStore.ts`)
To fix the compilation error, modify lines 131–139 in `src/store/appStore.ts` to include the missing fields:
```typescript
liveStream: data.liveStream || {
  id: '',
  title: '',
  platform: 'youtube',
  streamUrl: '',
  chatEnabled: false,
  offeringEnabled: false,
  status: 'scheduled',
  viewerCount: 0,
  scheduledAt: '', // Fixed
  createdAt: '',   // Fixed
},
```

### B. Recommended API Client Wrapper (`src/services/apiClient.ts`)
```typescript
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export class APIError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'APIError';
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;
  
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const token = useAuthStore.getState().token;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const config: RequestInit = {
    method: options.method || 'GET',
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // Intercept 401 Unauthorized or expired token 403
    if (response.status === 401 || response.status === 403) {
      let isTokenExpired = false;
      const clone = response.clone();
      try {
        const body = await clone.json();
        if (body.error === 'Invalid or expired token' || body.error === 'No token provided') {
          isTokenExpired = true;
        }
      } catch (_) {}

      if (response.status === 401 || isTokenExpired) {
        useAuthStore.getState().logout();
      }
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (_) {
        errorData = { error: 'Unknown API error' };
      }
      throw new APIError(response.status, errorData.error || response.statusText, errorData);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    return {} as T;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new Error(error instanceof Error ? error.message : 'Network error');
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, data?: any, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data?: any, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
```

### C. Client-Side Deserialization Mappers (`src/utils/mappers.ts`)
```typescript
import type { 
  User, Group, Content, PrayerRequest, Event, 
  PastoralNote, Donation, LiveStream, Message, AppNotification 
} from '../types/models';

export const dbMappers = {
  user: (raw: any): User => ({
    ...raw,
    onboardingCompleted: Boolean(raw.onboardingCompleted),
    privacySettings: typeof raw.privacySettings === 'string' 
      ? JSON.parse(raw.privacySettings) 
      : (raw.privacySettings || { showPhone: false, showEmail: true, showCity: true }),
    ministry: typeof raw.ministry === 'string' 
      ? JSON.parse(raw.ministry) 
      : (raw.ministry || []),
    groupIds: Array.isArray(raw.groupIds) ? raw.groupIds : [],
  }),

  group: (raw: any): Group => ({
    ...raw,
    isPublic: Boolean(raw.isPublic),
    memberIds: Array.isArray(raw.memberIds) ? raw.memberIds : [],
    coLeaderIds: Array.isArray(raw.coLeaderIds) ? raw.coLeaderIds : [],
  }),

  content: (raw: any): Content => ({
    ...raw,
    isDraft: Boolean(raw.isDraft),
    tags: typeof raw.tags === 'string' ? JSON.parse(raw.tags) : (raw.tags || []),
    viewCount: Number(raw.viewCount || 0),
  }),

  prayerRequest: (raw: any): PrayerRequest => ({
    ...raw,
    prayerCount: Number(raw.prayerCount || 0),
    prayedByIds: Array.isArray(raw.prayedByIds) ? raw.prayedByIds : [],
  }),

  event: (raw: any): Event => ({
    ...raw,
    requiresRSVP: Boolean(raw.requiresRSVP),
    reminderSent: Boolean(raw.reminderSent),
    targetGroupIds: Array.isArray(raw.targetGroupIds) ? raw.targetGroupIds : [],
    attendeeIds: Array.isArray(raw.attendeeIds) ? raw.attendeeIds : [],
    capacity: raw.capacity ? Number(raw.capacity) : undefined,
  }),

  pastoralNote: (raw: any): PastoralNote => ({
    ...raw,
    isPrivate: Boolean(raw.isPrivate),
  }),

  donation: (raw: any): Donation => ({
    ...raw,
    amount: Number(raw.amount),
    isRecurring: Boolean(raw.isRecurring),
  }),

  liveStream: (raw: any): LiveStream => ({
    ...raw,
    chatEnabled: Boolean(raw.chatEnabled),
    offeringEnabled: Boolean(raw.offeringEnabled),
    viewerCount: Number(raw.viewerCount || 0),
  }),

  message: (raw: any): Message => ({
    ...raw,
    isPinned: Boolean(raw.isPinned),
    readBy: Array.isArray(raw.readBy) ? raw.readBy : [],
  }),

  notification: (raw: any): AppNotification => ({
    ...raw,
    isRead: Boolean(raw.isRead),
  }),
};
```

---

## 5. Verification Method

1.  **TypeScript Verification**: Execute the command:
    ```bash
    npx tsc --noEmit --project tsconfig.json
    ```
    This verifies that all models, stores, and components compile cleanly without errors.
2.  **Auth Expiration Intercept Verification**:
    *   Log in to obtain a valid session.
    *   Corrupt the token in local storage or in memory:
        ```typescript
        useAuthStore.setState({ token: 'malformed_token_test' })
        ```
    *   Trigger any authenticated request.
    *   Verify the API responds with `403 Forbidden` and the client interceptor clears the store via `.logout()`, causing the routing engine to redirect the viewport to `/login`.
3.  **Schema Conversion / Serialization Verification**:
    *   Perform a database query returning raw data containing `0` and `1` values for fields like `onboardingCompleted` or `isDraft`.
    *   Pass the output through `dbMappers`.
    *   Confirm via assertions that fields evaluate strictly to JavaScript `true` or `false`, and text arrays are successfully parsed from JSON text.
