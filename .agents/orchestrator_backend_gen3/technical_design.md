# Technical Design: Congregación Digital Backend Persistence

## Executive Summary (Conclusion First)
To transition 'Congregación Digital' from simulated `localStorage` state to real database persistence, we will implement an Express.js backend using SQLite (`better-sqlite3`) and JWT authentication. The solution is fully compatible with local development concurrent workflows and Vercel serverless deployment by utilizing:
1. **Dynamic SQLite Storage**: In-memory (`:memory:`) database when deployed on Vercel, and file-based (`server/database.db`) in development.
2. **Auto-seeding**: Complete initial hydration of mock data from `src/constants/mockData.ts` (with passwords hashed using `bcryptjs`) when the database is empty.
3. **Zustand to REST API integration**: Tying client stores (`authStore.ts`, `appStore.ts`) to API endpoints under `/api`.
4. **Vercel Routing**: Precise rewrites configuration in `vercel.json` mapping both serverless API entrypoints and catching all nested React-Router client paths.

---

## 1. Database Schema Design (SQLite)
The schema balances relational normalized integrity for relational associations and JSON text serialization for lightweight non-indexed lists:

```sql
-- Configuration Table (Branding configurations)
CREATE TABLE IF NOT EXISTS configuration (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Users Table
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
    lastActiveAt TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    passwordHash TEXT NOT NULL
);

-- Groups Table
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
    createdAt TEXT NOT NULL
);

-- Group Members Junction Table (M:N)
CREATE TABLE IF NOT EXISTS group_members (
    groupId TEXT REFERENCES groups(id) ON DELETE CASCADE,
    userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    PRIMARY KEY (groupId, userId)
);

-- Group Co-Leaders Junction Table (M:N)
CREATE TABLE IF NOT EXISTS group_co_leaders (
    groupId TEXT REFERENCES groups(id) ON DELETE CASCADE,
    userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    PRIMARY KEY (groupId, userId)
);

-- Content Table
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
    publishedAt TEXT,
    scheduledAt TEXT,
    isDraft INTEGER NOT NULL CHECK (isDraft IN (0, 1)),
    viewCount INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
);

-- Prayer Requests Table
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
    answeredAt TEXT,
    createdAt TEXT NOT NULL
);

-- Prayer Intercessors Junction Table (M:N)
CREATE TABLE IF NOT EXISTS prayer_prayed_by (
    prayerId TEXT REFERENCES prayer_requests(id) ON DELETE CASCADE,
    userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    PRIMARY KEY (prayerId, userId)
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('service', 'cell', 'retreat', 'conference', 'social', 'training')),
    format TEXT NOT NULL CHECK (format IN ('in_person', 'virtual', 'hybrid')),
    location TEXT,
    virtualLink TEXT,
    coverImage TEXT,
    startDateTime TEXT NOT NULL,
    endDateTime TEXT NOT NULL,
    organizerId TEXT REFERENCES users(uid) ON DELETE SET NULL,
    capacity INTEGER,
    requiresRSVP INTEGER NOT NULL CHECK (requiresRSVP IN (0, 1)),
    rsvpDeadline TEXT,
    reminderSent INTEGER NOT NULL CHECK (reminderSent IN (0, 1)),
    createdAt TEXT NOT NULL
);

-- Event Target Groups Junction Table (M:N)
CREATE TABLE IF NOT EXISTS event_target_groups (
    eventId TEXT REFERENCES events(id) ON DELETE CASCADE,
    groupId TEXT REFERENCES groups(id) ON DELETE CASCADE,
    PRIMARY KEY (eventId, groupId)
);

-- Event Attendees Table (Tracks both RSVP and check-in attendance)
CREATE TABLE IF NOT EXISTS event_attendees (
    eventId TEXT REFERENCES events(id) ON DELETE CASCADE,
    userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('rsvp', 'attended')),
    PRIMARY KEY (eventId, userId, status)
);

-- Pastoral Notes Table
CREATE TABLE IF NOT EXISTS pastoral_notes (
    id TEXT PRIMARY KEY,
    memberId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    leaderId TEXT REFERENCES users(uid) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('visit', 'call', 'message', 'meeting', 'observation')),
    content TEXT NOT NULL,
    followUpDate TEXT,
    memberStatus TEXT NOT NULL CHECK (memberStatus IN ('new', 'integrating', 'active', 'inactive', 'crisis', 'restoration')),
    isPrivate INTEGER NOT NULL CHECK (isPrivate IN (0, 1)),
    createdAt TEXT NOT NULL
);

-- Donations Table
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
    createdAt TEXT NOT NULL
);

-- Live Stream Settings Table
CREATE TABLE IF NOT EXISTS live_stream (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('youtube', 'facebook', 'internal')),
    streamUrl TEXT NOT NULL,
    chatEnabled INTEGER NOT NULL CHECK (chatEnabled IN (0, 1)),
    offeringEnabled INTEGER NOT NULL CHECK (offeringEnabled IN (0, 1)),
    scheduledAt TEXT NOT NULL,
    startedAt TEXT,
    endedAt TEXT,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'live', 'ended')),
    viewerCount INTEGER NOT NULL DEFAULT 0,
    recordingUrl TEXT,
    createdAt TEXT NOT NULL
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversationId TEXT REFERENCES groups(id) ON DELETE CASCADE,
    senderId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'image', 'audio', 'file')),
    fileUrl TEXT,
    isPinned INTEGER NOT NULL CHECK (isPinned IN (0, 1)),
    createdAt TEXT NOT NULL
);

-- Message Read By Junction Table (M:N)
CREATE TABLE IF NOT EXISTS message_read_by (
    messageId TEXT REFERENCES messages(id) ON DELETE CASCADE,
    userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    PRIMARY KEY (messageId, userId)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('urgent', 'important', 'informational')),
    category TEXT NOT NULL CHECK (category IN ('prayer', 'event', 'message', 'group', 'content', 'pastoral', 'finance')),
    actionUrl TEXT,
    isRead INTEGER NOT NULL CHECK (isRead IN (0, 1)),
    createdAt TEXT NOT NULL
);

-- Static/Analytics Tables for dashboard charts
CREATE TABLE IF NOT EXISTS weekly_attendance (
    label TEXT PRIMARY KEY,
    value INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS formation_steps (
    label TEXT PRIMARY KEY,
    progress INTEGER NOT NULL
);
```

---

## 2. API Endpoints Specification

### Authentication Routes
- **`POST /api/auth/login`**: Authenticate email/password.
  - Body: `{ email, password }`
  - Response (200): `{ success: true, token, user }`
  - Response (401/403): Errors for invalid credentials or pending activation.
- **`POST /api/auth/register`**: Submit registration request (creates user in `pending` state).
  - Body: `{ email, password, displayName, city, country }`
  - Response (201): `{ success: true, message: 'Request submitted' }`
- **`POST /api/auth/onboarding`** (Protected): Submit onboarding info.
  - Body: `{ phone, favoriteVerse, testimony, privacySettings: { showPhone, showCity } }`
  - Response (200): `{ success: true, user }`
- **`GET /api/auth/me`** (Protected): Check active session.
  - Response (200): `{ user }`

### App & Administration Routes
- **`GET /api/bootstrap`** (Protected): Hydrate entire client application state.
  - Response (200): Returns all entity records mapping exactly to stores.
- **`POST /api/users/:uid/approve`** (Protected, Admin Only): Approve a user (`status` -> `active`).
- **`PUT /api/users/:uid`** (Protected): Update profile properties.
- **`POST /api/donations`** (Protected): Save a new donation.
- **`POST /api/prayer-requests`** (Protected): Save a new prayer request.
- **`POST /api/prayer-requests/:id/pray`** (Protected): Toggle prayer intercession.
- **`PUT /api/prayer-requests/:id/pastoral-note`** (Protected, Leader/Admin Only): Write pastoral annotation.
- **`POST /api/prayer-requests/:id/resolve`** (Protected): Mark request as answered.
- **`POST /api/pastoral-notes`** (Protected, Leader/Admin Only): Add pastoral follow-up note.
- **`POST /api/content`** (Protected, Admin Only): Create devotional/sermon content.
- **`POST /api/events`** (Protected, Leader/Admin Only): Create a new congregational event.
- **`POST /api/events/:id/rsvp`** (Protected): Toggle RSVP registration.
- **`POST /api/events/:id/attendance`** (Protected, Leader/Admin Only): Toggle check-in attendance.
- **`POST /api/messages`** (Protected): Send message in group chat.
- **`PUT /api/livestream`** (Protected, Admin Only): Update streaming configuration.
- **`PUT /api/config`** (Protected, Admin Only): Edit organization name or theme color.

---

## 3. Integration & Deployment Architecture

### Concurrency in Development
We configure `concurrently` in `package.json` to spin up both processes under `npm run dev`:
*   **Vite Client**: Running on `http://127.0.0.1:5173/` proxying `/api` requests to `http://127.0.0.1:3001/` via `vite.config.mjs` proxies.
*   **Express Server**: Running on `http://127.0.0.1:3001/` watched by `tsx` (TypeScript execute watcher) to support on-the-fly TS file compilation.

### Vercel Serverless bridge
1. We create `api/index.js` at the root which exports the Express app instance.
2. We adjust `vercel.json` to handle rewrites as follows:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "/api/index.js" },
       { "source": "/((?!assets|api|favicon.ico).*)", "destination": "/index.html" }
     ]
   }
   ```
3. The server checks `process.env.VERCEL`. If true, the SQLite database connection defaults to `:memory:` to bypass the read-only file system restriction on Vercel serverless containers. Seeding runs on database init if the database contains zero users.
