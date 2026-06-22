## 2026-06-22T16:05:04Z
Role: worker_frontend
Working Directory: C:\Users\Sebastián\Documents\Codex\2026-06-03\puedes-terminar-las-tareas-del-chat\.agents\worker_frontend_gen4\

Task:
Integrate the frontend Zustand stores with the Express/SQLite backend.
You need to perform the following steps:
1. Read `src/store/authStore.ts` and `src/store/appStore.ts` to understand their current implementations.
2. Read the backend server code in `server/index.js` to see the REST API endpoints and payload structures.
3. Update `src/store/authStore.ts` to:
   - Persist both the `user` and the `token` in Zustand/localStorage.
   - Implement `login` to POST to `/api/auth/login`. On success, store the token and user, and trigger `bootstrap()` in `appStore`.
   - Implement `logout` to clear user and token, and reset the `appStore` state cache.
   - Implement `completeOnboarding` to POST to `/api/auth/onboarding` with the token in the `Authorization: Bearer <token>` header.
4. Update `src/store/appStore.ts` to:
   - Add a `bootstrap()` async function that fetches `GET /api/bootstrap` (using the Bearer token) and populates the store state. If the request returns a 401 or 403, call `logout()` from `authStore`.
   - Update all store actions (e.g. `updateUserProfile`, `approveUser`, `toggleAttendance`, `addDonation`, `addPrayerRequest`, `incrementPrayerCount`, `updatePrayerPastoralNote`, `resolvePrayerRequest`, `addPastoralNote`, `addContent`, `addEvent`, `toggleRSVP`, `addMessage`, `updateLiveStreamSettings`, `updateOrganizationName`, `updateThemeColor`, `registerUser`) to perform their respective REST API requests using the Bearer token and then update the store state.
   - For `registerUser`, it should accept a password and POST to `/api/auth/register` with body containing email, password, displayName, city, country.
5. Update `src/pages/auth/Register.tsx` to add a Password input field, validate it, and pass it to `registerUser`.
6. Update `src/components/layout/AppLayout.tsx` (and any other appropriate entry point like `AppRouter.tsx` if needed) to call `bootstrap()` inside a `useEffect` on mount when the token is present.
7. Run `npm run typecheck` to verify that there are no TypeScript compile errors.
8. Run `npm run build` to verify the frontend builds successfully without errors.
Document all modifications, verification commands, and build results in your handoff report.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
