# Project: Congregación Digital Backend Persistence

## Architecture
We will implement an Express.js backend using SQLite as the persistent database. SQLite is portable, lightweight, and requires no external process setup.
The backend will:
1. Expose REST API endpoints under `/api`.
2. Implement token-based authentication (JWT) replacing the local credential check.
3. Keep the frontend (React + Vite) connected to the backend by modifying `authStore` and `appStore` to load and sync data via API requests.
4. Auto-seed mock data from `src/constants/mockData.ts` if the database is empty.
5. Provide a single unified command (e.g., in `package.json`) to run both backend and frontend servers in development, or run Express as a server serving the frontend statically in production.

## Code Layout
- `server/` - Directory for backend code.
  - `server/index.js` (or `server/server.js`) - Entry point, Express application.
  - `server/database.js` - SQLite connection, schema initialization, and data seeding.
  - `server/routes.js` (or inline in index.js) - REST API routes for authentication and CRUD actions.
- `src/store/` - Updated Zustand stores interfacing with the API.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Design | Analyze current pages, forms, and states; design SQLite schema & API routes | None | DONE |
| 2 | Backend Implementation | Create Express server + SQLite database, configure endpoints and seeding | M1 | IN_PROGRESS |
| 3 | Frontend Store Integration | Update authStore and appStore to invoke the Express backend API endpoints | M2 | PLANNED |
| 4 | Authentication & Guarding | Secure routes, hook up onboarding/registration, fix state synchronization | M3 | PLANNED |
| 5 | Compile & Verify | Run typescript type checks, verify build succeeds, test local scenarios | M4 | PLANNED |
| 6 | Git Push | Commit and push changes to the remote branch main on GitHub | M5 | PLANNED |

## Interface Contracts
### Auth API
- `POST /api/auth/login`
  - Input: `{ email, password }`
  - Output: `{ success: true, token, user }` or `{ success: false, error: 'Credenciales invalidas' }`
- `POST /api/auth/onboarding`
  - Headers: `Authorization: Bearer <token>`
  - Input: `{ phone, favoriteVerse, testimony, privacySettings }`
  - Output: `{ success: true, user }`

### App API (CRUD & Actions)
- `GET /api/bootstrap` (Initial data load)
  - Headers: `Authorization: Bearer <token>`
  - Output: all entities: `{ users, groups, content, prayerRequests, events, pastoralNotes, donations, messages, liveStream, notifications, organizationName, themeColor }`
- `PUT /api/users/:uid` (Update profile)
- `POST /api/users/:uid/approve` (Approve user)
- `POST /api/donations` (Add donation)
- `POST /api/prayer-requests` (Add prayer request)
- `POST /api/prayer-requests/:id/pray` (Increment prayer count/toggle user)
- `PUT /api/prayer-requests/:id/pastoral-note` (Update prayer pastoral note)
- `POST /api/prayer-requests/:id/resolve` (Resolve prayer request)
- `POST /api/pastoral-notes` (Add pastoral note)
- `POST /api/content` (Add content)
- `POST /api/events` (Add event)
- `POST /api/events/:id/rsvp` (Toggle RSVP)
- `POST /api/events/:id/attendance` (Toggle attendance)
- `POST /api/messages` (Add chat message)
- `PUT /api/livestream` (Update livestream settings)
- `PUT /api/organization` (Update org name and/or theme color)
