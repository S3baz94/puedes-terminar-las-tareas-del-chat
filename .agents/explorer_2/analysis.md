# Structured Analysis Report — Backend and Store Verification

## 1. Backend Server Endpoints Verification (`server/index.js`)

We analyzed the endpoints implemented in `server/index.js` against the interface contracts and requirements defined in `PROJECT.md`. The server implements all requested endpoints, which are categorized below:

### Auth API Endpoints
*   `POST /api/auth/register`: Submits a request to register a new user (inserts user with status `'pending'`).
*   `POST /api/auth/login`: Verifies user credentials using bcrypt, updates `lastActiveAt`, signs a JWT token, and returns the token and formatted user object.
*   `POST /api/auth/onboarding` (Authenticated): Updates onboarding fields (`phone`, `favoriteVerse`, `testimony`, `privacySettings`), sets `onboardingCompleted = 1`, and returns the updated user.
*   `GET /api/auth/me` (Authenticated): Retrieves the current authenticated user's profile.

### App API (CRUD & Actions) Endpoints
*   `GET /api/bootstrap` (Authenticated): Returns initial bootstrap data, including list of `users`, `groups`, `content`, `prayerRequests`, `events`, `pastoralNotes`, `donations`, `messages`, `liveStream`, `notifications`, and config settings (`organizationName`, `themeColor`).
*   `PUT /api/users/:uid` (Authenticated): Updates a user profile. Restricts certain updates (like `role` and `status`) to administrative roles (`admin`, `super_admin`). Also syncs `groupIds` in the join tables.
*   `POST /api/users/:uid/approve` (Admin/Super Admin only): Approves a user by setting their status to `'active'`.
*   `POST /api/users/:uid/suspend` (Admin/Super Admin only): Suspends a user by setting status to `'suspended'`.
*   `POST /api/users/:uid/activate` (Admin/Super Admin only): Activates a suspended user.
*   `PUT /api/users/:uid/role` (Admin/Super Admin only): Changes the user's role.
*   `POST /api/donations` (Authenticated): Inserts a donation record with status `'completed'`.
*   `POST /api/prayer-requests` (Authenticated): Inserts a new prayer request with status `'active'`.
*   `POST /api/prayer-requests/:id/pray` (Authenticated): Toggles prayer counts reactively (inserts/deletes relation in `prayer_prayed_by` and updates count in a transaction).
*   `PUT /api/prayer-requests/:id/pastoral-note` (Admin/Super Admin/Leader only): Updates the pastoral note on a prayer request.
*   `POST /api/prayer-requests/:id/resolve` (Authenticated): Resolves a prayer request (updates status to `'answered'`).
*   `POST /api/pastoral-notes` (Admin/Super Admin/Leader only): Inserts a pastoral note for a member.
*   `POST /api/content` (Admin/Super Admin only): Inserts content items.
*   `PUT /api/content/:id` (Admin/Super Admin only): Updates content items.
*   `DELETE /api/content/:id` (Admin/Super Admin only): Deletes a content item.
*   `GET /api/devotional-notes/:contentId` (Authenticated): Retrieves a user's personal devotional note for a content item.
*   `POST /api/devotional-notes/:contentId` (Authenticated): Saves or updates a devotional note.
*   `POST /api/events` (Admin/Super Admin/Leader only): Inserts a new event.
*   `PUT /api/events/:id` (Admin/Super Admin only): Updates an event.
*   `DELETE /api/events/:id` (Admin/Super Admin only): Deletes an event.
*   `POST /api/events/:id/rsvp` (Authenticated): Toggles a user's RSVP status.
*   `POST /api/events/:id/attendance` (Admin/Super Admin/Leader only): Toggles attendance status for a user.
*   `POST /api/messages` (Authenticated): Inserts a chat message.
*   `PUT /api/livestream` (Admin/Super Admin only): Updates the global livestream settings.
*   `PUT /api/config` / `PUT /api/organization` (Admin/Super Admin only): Updates configuration options (`organizationName` and `themeColor`).
*   `GET /api/analytics` (Admin/Super Admin only): Returns counts and sums for admin dashboards.

All requirements for endpoints, authorization restrictions, database validation, and format mappings from `PROJECT.md` are fully implemented.

---

## 2. Database Initialization and Mock Seeding (`server/database.js`)

The database connection, schema setup, and mock data seeding reside in `server/database.js`. Key features include:

### Database Connection Configuration
*   **Path Resolution**:
    *   If `process.env.VERCEL` is defined, the server initializes a transient in-memory database (`:memory:`).
    *   Otherwise, it resolves to a persistent SQLite database located at `server/database.db` relative to the current working directory.
*   **Journal Mode**: If running locally (non-Vercel), it enables Write-Ahead Logging (`WAL`) to optimize concurrent read/write operations.

### Schema Initialization
Inside the `initializeDatabase()` function, a transaction executes `CREATE TABLE IF NOT EXISTS` queries for all entities:
1.  `configuration`: Organization metadata.
2.  `users`: Main user details and password hashes.
3.  `groups`: Small group and ministry metadata.
4.  `group_members` & `group_co_leaders`: Join tables mapping users to groups.
5.  `content`: Devotionals, sermons, announcements.
6.  `prayer_requests` & `prayer_prayed_by`: Prayer requests and member interactions.
7.  `events`, `event_target_groups`, & `event_attendees`: Events and member RSVPs/attendance.
8.  `pastoral_notes`: Confidential follow-up notes.
9.  `donations`: Giving records.
10. `live_stream`: Current stream and settings.
11. `messages` & `message_read_by`: Group chats and read receipts.
12. `notifications`: System notifications for users.
13. `weekly_attendance`, `formation_steps`, `devotional_notes`: Metric and personal note tables.

### Mock Seeding
After schema setup, the function checks if the `users` table is empty (`SELECT COUNT(*) as count FROM users`). If it is `0`, a seeding transaction is triggered:
*   Imports mock data arrays from `./mockData.js`.
*   Applies `bcrypt.hashSync()` on plain-text credentials mapped from `demoCredentials` (using 10 salt rounds) and stores them in the `passwordHash` field.
*   Seeds all other tables sequentially while satisfying foreign key constraints.

---

## 3. Analysis of Test Failures (`verification/test_stores.ts`)

The test script `verification/test_stores.ts` fails when run directly. We investigated the root causes and verified the exact fixes required.

### Root Cause 1: Node.js Relative fetch and Missing Server
The stores (`appStore.ts` and `authStore.ts`) use relative URLs (e.g., `/api/auth/login`) with the global `fetch` API. In Node.js:
1.  Relative URLs cannot be parsed without a base URL, leading to `TypeError: Failed to parse URL from /api/auth/login`.
2.  The backend server is not running during the execution of the test script, so there is no API listener.

### Root Cause 2: ES Module Hoisting
If you import the server using `import app from '../server/index.js';` at the top of the file, ES module hoisting executes the server index script **before** any inline code (such as setting `process.env.VERCEL = 'true'`) is run. Consequently:
*   The server detects `process.env.VERCEL` is undefined, defaults to the persistent `server/database.db` file database, and starts listening on port `3001`, causing potential port collisions or dirty state issues.

### Root Cause 3: Missing Awaits on Async Store Actions
Multiple tests call async actions in the stores (such as `completeOnboarding`, `updateUserProfile`, `approveUser`, and `toggleAttendance`) but fail to `await` them. This causes the test assertions to execute synchronously *before* the backend server processes the request and updates the Zustand state.

### Root Cause 4: Unauthorized User Status and Automatic Logout
*   In Test 6 (`approveUser`) and Test 7 (`toggleAttendance`), the actions are run while the logged-in user is a regular member (`miembro@iglesia.com`).
*   The backend endpoints enforce authorization (`requireRole(['super_admin', 'admin'])`), and return a `403 Forbidden` error.
*   The `apiFetch` helper in `appStore.ts` intercepts the `403` status and automatically calls `logout()`, which clears the authenticated user from the store.
*   As a result, subsequent state persistence tests (Test 8 and Test 9) fail because `state.user` has been wiped.

---

## 4. Verified Resolution Strategy

To resolve all failures, `verification/test_stores.ts` should be updated with the following pattern:

1.  **Configure Environment Early**: Set `process.env.VERCEL = 'true'` before importing the server.
2.  **Use Dynamic Import**: Dynamically import `../server/index.js` to bypass ESM hoisting. This forces the server to use a clean, isolated in-memory SQLite database (`:memory:`) and prevents it from auto-listening on port 3001.
3.  **Start and Stop the Server Programmatically**: Start the imported Express `app` on a random free port (`app.listen(0)`) at the start of `runTests()`, and close it (`server.close()`) in a `finally` block at the end.
4.  **Mock/Intercept Global fetch**: Override `global.fetch` to prepend the test server's base URL (e.g. `http://127.0.0.1:PORT`) for all relative paths.
5.  **Await Async Actions & Prevent Race Conditions**:
    *   Change the tests to `async` functions and `await` all store actions (`updateUserProfile`, `approveUser`, etc.).
    *   Implement a poll-based wait helper (`waitFor`) for assertions in tests (like onboarding) where the store triggers background async actions without awaiting them internally.
6.  **Manage Authentication Roles during Test Lifecycle**:
    *   Log in as `admin@iglesia.com` before executing restricted actions like `approveUser` and `toggleAttendance` to avoid `403 Forbidden` responses.
    *   Log back in as `miembro@iglesia.com` before testing state persistence to ensure the member's state is correctly asserted.
