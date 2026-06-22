# Handoff Report - Explorer 2

## 1. Observation
This analysis was performed on the existing React frontend architecture, specifically inspecting state management and mock data defined in the following files:
*   `src/store/appStore.ts` (Lines 1 to 284)
*   `src/constants/mockData.ts` (Lines 1 to 422)
*   `src/types/models.ts` (Lines 1 to 236)
*   `package.json` (Lines 1 to 38)
*   `PROJECT.md` (Lines 1 to 58)

### Verbatim Mock Data & Store Structures
- **User Status & Roles** (`src/types/models.ts`):
  ```typescript
  export type Role = 'super_admin' | 'admin' | 'leader' | 'member' | 'visitor';
  export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';
  export type SpiritualStatus = 'new_believer' | 'growing' | 'established' | 'leader_in_training';
  ```
- **Zustand App Store Actions** (`src/store/appStore.ts`):
  - Toggling RSVP:
    ```typescript
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
    }
    ```
  - Toggling Attendance:
    ```typescript
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
    }
    ```
  - Increment Prayer Count:
    ```typescript
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
    }
    ```

## 2. Logic Chain
1. **Zustand to SQLite Transition**: The frontend manages collections (`users`, `groups`, `content`, etc.) as in-memory Javascript arrays with properties like `groupIds` and `attendeeIds` represented as string arrays. SQLite is a relational database and does not natively support array data types.
2. **Relational Normalization**:
   - M:N relationships like User-to-Group membership (`groupIds`), Group co-leaders (`coLeaderIds`), Event target groups (`targetGroupIds`), Event attendees (`attendeeIds`), and Prayer intercessors (`prayedByIds`) are mapped to explicit junction/join tables (`group_members`, `group_co_leaders`, `event_target_groups`, `event_attendees`, and `prayer_prayed_by`) with foreign key constraints targeting their primary keys (`userId`, `groupId`, `eventId`, `prayerId`).
   - Simple list values like user ministries (`ministry`) or content tags (`tags`) are stored as JSON arrays (`TEXT` type in SQLite containing serialized JSON) since they are lightweight and do not require indexing or foreign key enforcement.
   - Global configuration properties (`organizationName` and `themeColor`) are key-value singletons. They are mapped to a key-value `configuration` table to avoid creating single-row tables.
3. **API Alignment**:
   - The Express API endpoints directly map to the store's action methods.
   - The `/api/bootstrap` endpoint serves as a single combined fetch to load state variables (`users`, `groups`, `content`, `prayerRequests`, `events`, `pastoralNotes`, `donations`, `messages`, `liveStream`, `notifications`, `organizationName`, `themeColor`), which perfectly hydrates the Zustand store during application initialization.
   - Since the app is transitioning to token-based JWT authentication, endpoints require an `Authorization: Bearer <token>` header, and the user's `uid` can be securely retrieved from the token payload rather than relying solely on path variables.

## 3. Caveats
- **Attendance and RSVP Overlap**: In the React mock implementation (`appStore.ts`), `toggleRSVP` and `toggleAttendance` mutate the same array (`attendeeIds`). In a production database, RSVP (pre-event registration) and Attendance (actual check-in/presence) should ideally be tracked separately. The proposed schema supports both by creating an `event_attendees` table with a `status` column check-constrained to `('rsvp', 'attended')`.
- **Concurrency**: SQLite does not support native async operations or multiple write locks natively like PostgreSQL, but using `better-sqlite3` handles write-ahead logging (WAL) nicely for concurrent reading and writing.

## 4. Conclusion
Below is the designed SQLite DDL Schema and REST API endpoint mapping necessary to support full backend persistence for the application.

### SQLite Schema DDL

```sql
-- 1. Configuration Table (Key-Value pair for global state)
CREATE TABLE IF NOT EXISTS configuration (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    displayName TEXT NOT NULL,
    photoURL TEXT,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'leader', 'member', 'visitor')),
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    birthDate TEXT, -- ISO 8601 YYYY-MM-DD
    baptismDate TEXT, -- ISO 8601 YYYY-MM-DD
    favoriteVerse TEXT,
    testimony TEXT,
    ministry TEXT, -- JSON array of strings
    leaderId TEXT REFERENCES users(uid) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    spiritualStatus TEXT CHECK (spiritualStatus IN ('new_believer', 'growing', 'established', 'leader_in_training')),
    privacySettings TEXT NOT NULL, -- JSON object: {"showPhone": boolean, "showEmail": boolean, "showCity": boolean}
    onboardingCompleted INTEGER NOT NULL CHECK (onboardingCompleted IN (0, 1)),
    lastActiveAt TEXT NOT NULL, -- ISO 8601 timestamp
    createdAt TEXT NOT NULL -- ISO 8601 timestamp
);

-- 3. Groups Table
CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cell', 'ministry', 'bible_study', 'youth', 'couples', 'women', 'men')),
    leaderId TEXT REFERENCES users(uid) ON DELETE SET NULL,
    maxCapacity INTEGER NOT NULL,
    meetingDay TEXT NOT NULL,
    meetingTime TEXT NOT NULL,
    meetingFormat TEXT NOT NULL CHECK (meetingFormat IN ('in_person', 'virtual', 'hybrid')),
    meetingLocation TEXT,
    meetingLink TEXT,
    isPublic INTEGER NOT NULL CHECK (isPublic IN (0, 1)),
    coverImage TEXT,
    createdAt TEXT NOT NULL -- ISO 8601 timestamp
);

-- 4. Group Members Junction Table
CREATE TABLE IF NOT EXISTS group_members (
    groupId TEXT REFERENCES groups(id) ON DELETE CASCADE,
    userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    PRIMARY KEY (groupId, userId)
);

-- 5. Group Co-Leaders Junction Table
CREATE TABLE IF NOT EXISTS group_co_leaders (
    groupId TEXT REFERENCES groups(id) ON DELETE CASCADE,
    userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    PRIMARY KEY (groupId, userId)
);

-- 6. Content Table
CREATE TABLE IF NOT EXISTS content (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('sermon', 'devotional', 'post', 'announcement')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    coverImage TEXT,
    audioUrl TEXT,
    videoUrl TEXT,
    authorId TEXT REFERENCES users(uid) ON DELETE SET NULL,
    series TEXT,
    tags TEXT, -- JSON array of strings
    bibleReference TEXT,
    visibility TEXT NOT NULL CHECK (visibility IN ('public', 'members', 'leaders', 'admin')),
    publishedAt TEXT, -- ISO 8601 timestamp
    scheduledAt TEXT, -- ISO 8601 timestamp
    isDraft INTEGER NOT NULL CHECK (isDraft IN (0, 1)),
    viewCount INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL -- ISO 8601 timestamp
);

-- 7. Prayer Requests Table
CREATE TABLE IF NOT EXISTS prayer_requests (
    id TEXT PRIMARY KEY,
    userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    visibility TEXT NOT NULL CHECK (visibility IN ('public', 'group', 'private')),
    groupId TEXT REFERENCES groups(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'answered', 'closed')),
    prayerCount INTEGER NOT NULL DEFAULT 0,
    pastoralNote TEXT,
    answeredAt TEXT, -- ISO 8601 timestamp
    createdAt TEXT NOT NULL -- ISO 8601 timestamp
);

-- 8. Prayer Intercessors Junction Table
CREATE TABLE IF NOT EXISTS prayer_prayed_by (
    prayerId TEXT REFERENCES prayer_requests(id) ON DELETE CASCADE,
    userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    PRIMARY KEY (prayerId, userId)
);

-- 9. Events Table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('service', 'cell', 'retreat', 'conference', 'social', 'training')),
    format TEXT NOT NULL CHECK (format IN ('in_person', 'virtual', 'hybrid')),
    location TEXT,
    virtualLink TEXT,
    coverImage TEXT,
    startDateTime TEXT NOT NULL, -- ISO 8601 timestamp
    endDateTime TEXT NOT NULL, -- ISO 8601 timestamp
    organizerId TEXT REFERENCES users(uid) ON DELETE SET NULL,
    capacity INTEGER,
    requiresRSVP INTEGER NOT NULL CHECK (requiresRSVP IN (0, 1)),
    rsvpDeadline TEXT, -- ISO 8601 timestamp
    reminderSent INTEGER NOT NULL CHECK (reminderSent IN (0, 1)),
    createdAt TEXT NOT NULL -- ISO 8601 timestamp
);

-- 10. Event Target Groups Junction Table
CREATE TABLE IF NOT EXISTS event_target_groups (
    eventId TEXT REFERENCES events(id) ON DELETE CASCADE,
    groupId TEXT REFERENCES groups(id) ON DELETE CASCADE,
    PRIMARY KEY (eventId, groupId)
);

-- 11. Event Attendees (both RSVP and actual attendance check-ins)
CREATE TABLE IF NOT EXISTS event_attendees (
    eventId TEXT REFERENCES events(id) ON DELETE CASCADE,
    userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('rsvp', 'attended')),
    PRIMARY KEY (eventId, userId, status)
);

-- 12. Pastoral Notes Table
CREATE TABLE IF NOT EXISTS pastoral_notes (
    id TEXT PRIMARY KEY,
    memberId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    leaderId TEXT REFERENCES users(uid) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('visit', 'call', 'message', 'meeting', 'observation')),
    content TEXT NOT NULL,
    followUpDate TEXT, -- ISO 8601 date YYYY-MM-DD
    memberStatus TEXT NOT NULL CHECK (memberStatus IN ('new', 'integrating', 'active', 'inactive', 'crisis', 'restoration')),
    isPrivate INTEGER NOT NULL CHECK (isPrivate IN (0, 1)),
    createdAt TEXT NOT NULL -- ISO 8601 timestamp
);

-- 13. Donations Table
CREATE TABLE IF NOT EXISTS donations (
    id TEXT PRIMARY KEY,
    userId TEXT REFERENCES users(uid) ON DELETE SET NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'COP',
    fund TEXT NOT NULL CHECK (fund IN ('tithe', 'offering', 'missions', 'building', 'social')),
    method TEXT NOT NULL CHECK (method IN ('card', 'pse', 'transfer', 'cash')),
    stripePaymentId TEXT,
    receiptUrl TEXT,
    isRecurring INTEGER NOT NULL CHECK (isRecurring IN (0, 1)),
    recurringFrequency TEXT CHECK (recurringFrequency IN ('weekly', 'biweekly', 'monthly')),
    status TEXT NOT NULL CHECK (status IN ('completed', 'pending', 'failed')),
    createdAt TEXT NOT NULL -- ISO 8601 timestamp
);

-- 14. Live Stream Settings Table
CREATE TABLE IF NOT EXISTS live_stream (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('youtube', 'facebook', 'internal')),
    streamUrl TEXT NOT NULL,
    chatEnabled INTEGER NOT NULL CHECK (chatEnabled IN (0, 1)),
    offeringEnabled INTEGER NOT NULL CHECK (offeringEnabled IN (0, 1)),
    scheduledAt TEXT NOT NULL, -- ISO 8601 timestamp
    startedAt TEXT, -- ISO 8601 timestamp
    endedAt TEXT, -- ISO 8601 timestamp
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'live', 'ended')),
    viewerCount INTEGER NOT NULL DEFAULT 0,
    recordingUrl TEXT,
    createdAt TEXT NOT NULL -- ISO 8601 timestamp
);

-- 15. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversationId TEXT REFERENCES groups(id) ON DELETE CASCADE,
    senderId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'image', 'audio', 'file')),
    fileUrl TEXT,
    isPinned INTEGER NOT NULL CHECK (isPinned IN (0, 1)),
    createdAt TEXT NOT NULL -- ISO 8601 timestamp
);

-- 16. Message Read By Junction Table
CREATE TABLE IF NOT EXISTS message_read_by (
    messageId TEXT REFERENCES messages(id) ON DELETE CASCADE,
    userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    PRIMARY KEY (messageId, userId)
);

-- 17. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('urgent', 'important', 'informational')),
    category TEXT NOT NULL CHECK (category IN ('prayer', 'event', 'message', 'group', 'content', 'pastoral', 'finance')),
    actionUrl TEXT,
    isRead INTEGER NOT NULL CHECK (isRead IN (0, 1)),
    createdAt TEXT NOT NULL -- ISO 8601 timestamp
);

-- 18. Weekly Attendance Table (Static/dashboard visualization analytics)
CREATE TABLE IF NOT EXISTS weekly_attendance (
    label TEXT PRIMARY KEY,
    value INTEGER NOT NULL
);

-- 19. Formation Steps Table (Static/dashboard visualization analytics)
CREATE TABLE IF NOT EXISTS formation_steps (
    label TEXT PRIMARY KEY,
    progress INTEGER NOT NULL
);
```

### Express REST API Mapping

#### General Headers (For all protected routes)
```http
Authorization: Bearer <JWT_TOKEN>
```

---

#### 1. Bootstrap State
- **GET `/api/bootstrap`**
  - **Description**: Returns the initial configuration, users, groups, content, prayer requests, events, pastoral notes, donations, notifications, live stream, and messages. Used for hydrating the frontend Zustand store on startup.
  - **Output (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "configuration": { "organizationName": "Los Invisibles de Jesus", "themeColor": "#4F46E5" },
        "users": [...],
        "groups": [...],
        "content": [...],
        "prayerRequests": [...],
        "events": [...],
        "pastoralNotes": [...],
        "donations": [...],
        "liveStream": {...},
        "notifications": [...],
        "messages": [...]
      }
    }
    ```

---

#### 2. Auth & User Management
- **POST `/api/auth/register`**
  - **Description**: Creates a new user in pending state. Maps to `registerUser`.
  - **Input Body**:
    ```json
    {
      "email": "nuevo@iglesia.com",
      "displayName": "Daniel Ortiz",
      "phone": "+57 305 212 9001",
      "city": "Barranquilla",
      "country": "Colombia",
      "birthDate": "1995-10-10",
      "baptismDate": "2026-01-01",
      "favoriteVerse": "Juan 3:16",
      "testimony": "Mi testimonio..."
    }
    ```
  - **Output (201 Created)**: `{ "success": true, "user": { ... } }`

- **POST `/api/users/:uid/approve`**
  - **Description**: Approves a pending user (Admin/Leader only). Maps to `approveUser`.
  - **Output (200 OK)**: `{ "success": true, "message": "User approved successfully" }`

- **PUT `/api/users/:uid`**
  - **Description**: Updates partial user profile fields. Maps to `updateUserProfile`.
  - **Input Body**: `{ "displayName": "New Name", "favoriteVerse": "New Verse" }`
  - **Output (200 OK)**: `{ "success": true, "user": { ... } }`

---

#### 3. Prayer Requests
- **POST `/api/prayer-requests`**
  - **Description**: Adds a new prayer request. Maps to `addPrayerRequest`.
  - **Input Body**:
    ```json
    {
      "userId": "u-member",
      "title": "Direccion laboral",
      "description": "Orar por una entrevista importante...",
      "visibility": "group",
      "groupId": "g-central"
    }
    ```
  - **Output (201 Created)**: `{ "success": true, "prayerRequest": { ... } }`

- **POST `/api/prayer-requests/:id/pray`**
  - **Description**: Toggles whether a user has prayed for a request. Increments/decrements `prayerCount` and adds/removes the user to/from intercessors. Maps to `incrementPrayerCount`.
  - **Input Body**: `{ "userId": "u-leader" }`
  - **Output (200 OK)**: `{ "success": true, "prayerCount": 32, "prayedByIds": [...] }`

- **PUT `/api/prayer-requests/:id/pastoral-note`**
  - **Description**: Updates the pastoral note on a prayer request (Leaders/Admins only). Maps to `updatePrayerPastoralNote`.
  - **Input Body**: `{ "note": "Hacer seguimiento el jueves..." }`
  - **Output (200 OK)**: `{ "success": true }`

- **POST `/api/prayer-requests/:id/resolve`**
  - **Description**: Marks the prayer request as answered. Maps to `resolvePrayerRequest`.
  - **Output (200 OK)**: `{ "success": true, "answeredAt": "2026-06-22T15:52:00Z" }`

---

#### 4. Events
- **POST `/api/events`**
  - **Description**: Adds a new event. Maps to `addEvent`.
  - **Input Body**:
    ```json
    {
      "title": "Reunion Casa Central",
      "description": "Estudio biblico...",
      "type": "cell",
      "format": "hybrid",
      "location": "Cra 15 #82-40",
      "virtualLink": "https://meet.google.com/demo-central",
      "startDateTime": "2026-06-04T19:30:00-05:00",
      "endDateTime": "2026-06-04T21:00:00-05:00",
      "organizerId": "u-leader",
      "targetGroupIds": ["g-central"],
      "capacity": 18,
      "requiresRSVP": true,
      "rsvpDeadline": "2026-06-04T12:00:00-05:00"
    }
    ```
  - **Output (201 Created)**: `{ "success": true, "event": { ... } }`

- **POST `/api/events/:id/rsvp`**
  - **Description**: Toggles RSVP status for the user. Maps to `toggleRSVP`.
  - **Input Body**: `{ "userId": "u-member" }`
  - **Output (200 OK)**: `{ "success": true, "attendeeIds": [...] }`

- **POST `/api/events/:id/attendance`**
  - **Description**: Toggles physical attendance for a user. Maps to `toggleAttendance`.
  - **Input Body**: `{ "userId": "u-member" }`
  - **Output (200 OK)**: `{ "success": true, "attendeeIds": [...] }`

---

#### 5. Pastoral Notes
- **POST `/api/pastoral-notes`**
  - **Description**: Creates a new pastoral note (Leaders/Admins only). Maps to `addPastoralNote`.
  - **Input Body**:
    ```json
    {
      "memberId": "u-member",
      "leaderId": "u-leader",
      "type": "call",
      "content": "Conversacion sobre alabanza...",
      "followUpDate": "2026-06-06",
      "memberStatus": "active",
      "isPrivate": true
    }
    ```
  - **Output (201 Created)**: `{ "success": true, "pastoralNote": { ... } }`

---

#### 6. Content Management
- **POST `/api/content`**
  - **Description**: Publishes a new devotional, sermon, post, or announcement. Maps to `addContent`.
  - **Input Body**:
    ```json
    {
      "type": "devotional",
      "title": "Devocional del dia",
      "body": "Texto completo...",
      "excerpt": "Breve resumen...",
      "authorId": "u-admin",
      "tags": ["devocional", "oracion"],
      "bibleReference": "Mateo 6:33",
      "visibility": "members",
      "isDraft": false
    }
    ```
  - **Output (201 Created)**: `{ "success": true, "content": { ... } }`

---

#### 7. Donations
- **POST `/api/donations`**
  - **Description**: Records a donation event. Maps to `addDonation`.
  - **Input Body**:
    ```json
    {
      "userId": "u-member",
      "amount": 120000,
      "currency": "COP",
      "fund": "tithe",
      "method": "card",
      "stripePaymentId": "pi_demo_001",
      "receiptUrl": "#",
      "isRecurring": true,
      "recurringFrequency": "monthly"
    }
    ```
  - **Output (201 Created)**: `{ "success": true, "donation": { ... } }`

---

#### 8. Live Stream Settings
- **PUT `/api/livestream`**
  - **Description**: Updates active live stream settings. Maps to `updateLiveStreamSettings`.
  - **Input Body**:
    ```json
    {
      "title": "Culto en vivo",
      "status": "live",
      "streamUrl": "https://youtube.com/demo"
    }
    ```
  - **Output (200 OK)**: `{ "success": true, "liveStream": { ... } }`

---

#### 9. Configuration (Theme & Org Name)
- **PUT `/api/config`**
  - **Description**: Updates branding color and/or organization name. Maps to `updateThemeColor` and `updateOrganizationName`.
  - **Input Body**:
    ```json
    {
      "organizationName": "Iglesia Digital Nueva",
      "themeColor": "#3B82F6"
    }
    ```
  - **Output (200 OK)**: `{ "success": true }`

---

#### 10. Messages (Group Chats)
- **POST `/api/messages`**
  - **Description**: Sends a message to a group chat. Maps to `addMessage`.
  - **Input Body**:
    ```json
    {
      "conversationId": "g-central",
      "senderId": "u-member",
      "content": "Hola a todos!"
    }
    ```
  - **Output (201 Created)**: `{ "success": true, "message": { ... } }`

---

## 5. Verification Method
- **TypeScript Type Validation**: Run `npm run typecheck` inside the root workspace folder to verify standard compiler checks.
- **SQLite Database Testing**: The DDL script can be executed on an empty SQLite database using:
  ```powershell
  # Using better-sqlite3 or sqlite3 CLI to test script validation
  sqlite3 test_database.db < schema.sql
  ```
  Check that the database creates all 19 tables without errors and foreign key triggers are configured correctly.
