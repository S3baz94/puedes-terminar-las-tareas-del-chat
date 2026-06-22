# Handoff Report — Explorer 1 (Milestone 1)

## 1. Observation

Direct observations and citations from the codebase:

1. **Authentication Store** (`src/store/authStore.ts`):
   - The frontend manages authentication state using Zustand's `persist` middleware, storing it in `localStorage` under the key `'congregacion-digital-auth'`:
     ```typescript
     // Lines 75-78:
     {
       name: 'congregacion-digital-auth',
       partialize: (state) => ({ user: state.user }),
     }
     ```
   - The login function simulates network latency and uses hardcoded credentials (`demoCredentials`) mapped to user records in the global app store (`useAppStore.getState().users`):
     ```typescript
     // Lines 29-47:
     async login(email, password) {
       set({ status: 'loading', error: null });
       await new Promise((resolve) => window.setTimeout(resolve, 380));

       const credential = demoCredentials.find(
         (item) =>
           item.email.toLowerCase() === email.trim().toLowerCase() &&
           item.password === password,
       );

       const users = useAppStore.getState().users;
       const user = credential
         ? users.find((candidate) => candidate.email === credential.email) ?? null
         : null;
       ...
     ```
   - Onboarding completion calls both auth state and app store update methods:
     ```typescript
     // Lines 55-72:
     completeOnboarding(details) {
       set((state) => {
         if (!state.user) return { user: null };
         
         const updatedUser: User = {
           ...state.user,
           ...details,
           onboardingCompleted: true,
         };
         
         // Sync to appStore
         useAppStore.getState().updateUserProfile(state.user.uid, {
           ...details,
           onboardingCompleted: true,
         });

         return { user: updatedUser };
       });
     }
     ```

2. **Global App Store** (`src/store/appStore.ts`):
   - User registration behaves as a pending request flow. A registered user gets `status: 'pending'` and `onboardingCompleted: false`:
     ```typescript
     // Lines 255-277:
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
     }
     ```
   - Admin approval activates the user and pushes changes to both stores:
     ```typescript
     // Lines 94-107:
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
     }
     ```

3. **Routing Configuration** (`src/routes/AppRouter.tsx`):
   - Public paths include `/login`, `/registro`, and `/olvide-contrasena`.
   - Private and role-based paths are grouped under `PrivateRoute`:
     ```typescript
     // Lines 33-35:
     <Route element={<PrivateRoute />}>
       <Route element={<Onboarding />} path="/onboarding" />
       <Route element={<AppLayout />}>
     ```
   - `RoleRoute` restricts dashboard/modules accessibility based on `user.role`:
     ```typescript
     // Lines 38, 49, 59:
     <Route element={<RoleRoute roles={['super_admin', 'admin']} />}>
     ...
     <Route element={<RoleRoute roles={['leader']} />}>
     ...
     <Route element={<RoleRoute roles={['member']} />}>
     ```

4. **Types and Models** (`src/types/models.ts`):
   - Roles include: `'super_admin' | 'admin' | 'leader' | 'member' | 'visitor'` (line 1).
   - User statuses: `'active' | 'inactive' | 'suspended' | 'pending'` (line 3).
   - Spiritual statuses: `'new_believer' | 'growing' | 'established' | 'leader_in_training'` (lines 4-8).
   - Privacy settings: `showPhone: boolean`, `showEmail: boolean`, `showCity: boolean` (lines 10-14).

5. **Project Environment** (`package.json`):
   - Node-specific dependencies for database, hashing, and token operations:
     ```json
     "dependencies": {
       "bcryptjs": "^3.0.3",
       "better-sqlite3": "^12.11.1",
       "express": "^5.2.1",
       "jsonwebtoken": "^9.0.3"
     }
     ```

---

## 2. Logic Chain

1. **Current Flow Breakdown**:
   - **Registration**: Guest requests access by supplying their `displayName`, `email`, and `city`. They are saved with `status: 'pending'`, `role: 'member'`, and `onboardingCompleted: false`.
   - **Approval**: Admins transition a user from `status: 'pending'` to `status: 'active'`.
   - **Login**: Compares inputs with mock profiles. Once authenticated, user role routes are matched. If `onboardingCompleted` is false, they complete their profile details at `/onboarding`.
   - **Onboarding**: Saves `phone`, `favoriteVerse`, `testimony`, and `privacySettings` (specifically `showPhone` and `showCity` toggles), sets `onboardingCompleted: true`, and navigates to the role's home path.

2. **Transitioning to SQLite & API Routing**:
   - **Data Types mapping**: SQLite lacks lists/arrays and boolean types. Thus, we represent `onboardingCompleted` and `privacySettings` boolean properties as `INTEGER` (0 or 1). Array fields (`ministry`, `groupIds`) require either a normalized relation table structure or JSON columns (`TEXT`).
   - **Security**: In the database, we replace mock plain text credentials with a `password_hash` column. The backend must hash passwords on registration (`/api/auth/register`) and check them on login (`/api/auth/login`) using the `bcryptjs` dependency.
   - **Session Verification**: Use stateless JWT tokens via `jsonwebtoken` generated during login and verified using HTTP `Authorization: Bearer <token>` headers on private requests.

---

## 3. Caveats

- **Onboarding Route Enforcement**: The current frontend does not automatically force a user to go to `/onboarding` immediately after login if `onboardingCompleted` is false. However, for a production API, the login response should flag this, and the router should intercept and redirect.
- **Visitor Role**: Although defined in `types/models.ts`, the visitor role has no protected dashboard routes or initial mockup entries.
- **Relational vs. JSON Arrays**: SQLite supports JSON queries natively. Storing `groupIds` and `ministries` as JSON arrays inside the `users` table simplifies schema migration, but join tables (`user_groups`, `user_ministries`) ensure standard database integrity. Both schema variations are provided below.

---

## 4. Conclusion

The authentication and registration mechanics can be fully backed by an Express backend utilizing SQLite and JWT. Below is the proposed database structure and API documentation.

### A. Database Schema Design (SQLite)

#### Option A: Fully Normalized (Recommended)
This approach separates join entities into normalized tables to ensure relational consistency.

```sql
-- Users Table
CREATE TABLE users (
    uid TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    photo_url TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'admin', 'leader', 'member', 'visitor')),
    phone TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    birth_date TEXT, -- YYYY-MM-DD
    baptism_date TEXT, -- YYYY-MM-DD
    favorite_verse TEXT,
    testimony TEXT,
    leader_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    spiritual_status TEXT NOT NULL DEFAULT 'new_believer' CHECK (spiritual_status IN ('new_believer', 'growing', 'established', 'leader_in_training')),
    
    -- Privacy Settings (Represented as integers: 0 = false, 1 = true)
    show_phone INTEGER NOT NULL DEFAULT 0 CHECK (show_phone IN (0, 1)),
    show_email INTEGER NOT NULL DEFAULT 1 CHECK (show_email IN (0, 1)),
    show_city INTEGER NOT NULL DEFAULT 1 CHECK (show_city IN (0, 1)),
    
    onboarding_completed INTEGER NOT NULL DEFAULT 0 CHECK (onboarding_completed IN (0, 1)),
    last_active_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leader_id) REFERENCES users(uid) ON DELETE SET NULL
);

-- User Ministries Table (Many-to-Many relation)
CREATE TABLE user_ministries (
    user_uid TEXT NOT NULL,
    ministry_name TEXT NOT NULL,
    PRIMARY KEY (user_uid, ministry_name),
    FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- User Groups Table (Many-to-Many relation)
CREATE TABLE user_groups (
    user_uid TEXT NOT NULL,
    group_id TEXT NOT NULL, -- References groups(id) table in future phases
    PRIMARY KEY (user_uid, group_id),
    FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_leader_id ON users(leader_id);
```

#### Option B: JSON Column Based (Lightweight alternative)
Leverages SQLite's native JSON operations to store arrays and nested configuration blocks directly.

```sql
CREATE TABLE users (
    uid TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    photo_url TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'admin', 'leader', 'member', 'visitor')),
    phone TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    birth_date TEXT,
    baptism_date TEXT,
    favorite_verse TEXT,
    testimony TEXT,
    
    -- JSON Arrays
    ministry TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(ministry)),
    group_ids TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(group_ids)),
    
    leader_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    spiritual_status TEXT NOT NULL DEFAULT 'new_believer' CHECK (spiritual_status IN ('new_believer', 'growing', 'established', 'leader_in_training')),
    
    -- Nested JSON structure for settings
    privacy_settings TEXT NOT NULL DEFAULT '{"showPhone":false,"showEmail":true,"showCity":true}' CHECK(json_valid(privacy_settings)),
    
    onboarding_completed INTEGER NOT NULL DEFAULT 0 CHECK (onboarding_completed IN (0, 1)),
    last_active_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leader_id) REFERENCES users(uid) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

---

### B. API Routing Design

#### 1. Authenticate / Login
- **Endpoint**: `POST /api/auth/login`
- **Headers**:
  - `Content-Type: application/json`
- **Input (JSON)**:
  ```json
  {
    "email": "miembro@iglesia.com",
    "password": "Miembro123!"
  }
  ```
- **Responses**:
  - **200 OK** (Successful Authentication):
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "uid": "u-member",
        "email": "miembro@iglesia.com",
        "displayName": "Laura Torres",
        "photoURL": null,
        "role": "member",
        "phone": "+57 302 887 9000",
        "city": "Cali",
        "country": "Colombia",
        "birthDate": "1997-09-21",
        "baptismDate": "2024-03-17",
        "favoriteVerse": "Mateo 6:33",
        "testimony": "Inicio su ruta de formacion espiritual este ano.",
        "ministry": ["Alabanza"],
        "groupIds": ["g-central"],
        "leaderId": "u-leader",
        "status": "active",
        "spiritualStatus": "growing",
        "privacySettings": {
          "showPhone": false,
          "showEmail": true,
          "showCity": true
        },
        "onboardingCompleted": true,
        "lastActiveAt": "2026-06-01T16:58:00-05:00",
        "createdAt": "2025-09-04T10:00:00-05:00"
      }
    }
    ```
  - **401 Unauthorized** (Invalid email or password):
    ```json
    {
      "error": "Credenciales inválidas.",
      "code": "INVALID_CREDENTIALS"
    }
    ```
  - **403 Forbidden** (Registration is pending approval):
    ```json
    {
      "error": "Su cuenta está pendiente de aprobación por un administrador.",
      "code": "ACCOUNT_PENDING_APPROVAL"
    }
    ```

#### 2. Request Access / Register
- **Endpoint**: `POST /api/auth/register`
- **Headers**:
  - `Content-Type: application/json`
- **Input (JSON)**:
  ```json
  {
    "displayName": "Daniel Ortiz",
    "email": "nuevo@iglesia.com",
    "password": "NewSecurePassword123!",
    "city": "Barranquilla",
    "country": "Colombia"
  }
  ```
- **Responses**:
  - **201 Created** (Registration request stored with `pending` status):
    ```json
    {
      "message": "Solicitud de registro creada. El administrador revisará su solicitud.",
      "uid": "u-1719000000000"
    }
    ```
  - **400 Bad Request** (Missing fields or invalid email/password requirements):
    ```json
    {
      "error": "El nombre completo, correo y contraseña son campos obligatorios.",
      "code": "VALIDATION_ERROR",
      "details": {
        "password": "La contraseña debe tener al menos 8 caracteres y una mayúscula."
      }
    }
    ```
  - **409 Conflict** (Email is already registered):
    ```json
    {
      "error": "El correo electrónico ya está registrado.",
      "code": "EMAIL_ALREADY_EXISTS"
    }
    ```

#### 3. Complete Profile / Onboarding
- **Endpoint**: `POST /api/auth/onboarding`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT_TOKEN>`
- **Input (JSON)**:
  ```json
  {
    "phone": "+57 305 212 9001",
    "favoriteVerse": "Juan 3:16",
    "testimony": "Mi testimonio...",
    "privacySettings": {
      "showPhone": true,
      "showCity": true
    }
  }
  ```
- **Responses**:
  - **200 OK** (Onboarding complete):
    ```json
    {
      "message": "Perfil completado con éxito.",
      "user": {
        "uid": "u-1719000000000",
        "email": "nuevo@iglesia.com",
        "displayName": "Daniel Ortiz",
        "role": "member",
        "phone": "+57 305 212 9001",
        "city": "Barranquilla",
        "country": "Colombia",
        "favoriteVerse": "Juan 3:16",
        "testimony": "Mi testimonio...",
        "ministry": [],
        "groupIds": [],
        "status": "active",
        "spiritualStatus": "new_believer",
        "privacySettings": {
          "showPhone": true,
          "showEmail": true,
          "showCity": true
        },
        "onboardingCompleted": true,
        "lastActiveAt": "2026-06-22T10:52:00-05:00",
        "createdAt": "2026-05-31T21:02:00-05:00"
      }
    }
    ```
  - **401 Unauthorized** (Missing or invalid authorization token):
    ```json
    {
      "error": "Sesión inválida o expirada.",
      "code": "UNAUTHORIZED"
    }
    ```

#### 4. Fetch Current Session (SPA Refresh helper)
- **Endpoint**: `GET /api/auth/me`
- **Headers**:
  - `Authorization: Bearer <JWT_TOKEN>`
- **Responses**:
  - **200 OK**:
    ```json
    {
      "user": {
        "uid": "u-member",
        "email": "miembro@iglesia.com",
        "displayName": "Laura Torres",
        "photoURL": null,
        "role": "member",
        "phone": "+57 302 887 9000",
        "city": "Cali",
        "country": "Colombia",
        "birthDate": "1997-09-21",
        "baptismDate": "2024-03-17",
        "favoriteVerse": "Mateo 6:33",
        "testimony": "Inicio su ruta de formacion espiritual este ano.",
        "ministry": ["Alabanza"],
        "groupIds": ["g-central"],
        "leaderId": "u-leader",
        "status": "active",
        "spiritualStatus": "growing",
        "privacySettings": {
          "showPhone": false,
          "showEmail": true,
          "showCity": true
        },
        "onboardingCompleted": true,
        "lastActiveAt": "2026-06-01T16:58:00-05:00",
        "createdAt": "2025-09-04T10:00:00-05:00"
      }
    }
    ```
  - **401 Unauthorized**:
    ```json
    {
      "error": "No autorizado.",
      "code": "UNAUTHORIZED"
    }
    ```

#### 5. User Approval (Admin Protected)
- **Endpoint**: `POST /api/admin/users/:userId/approve`
- **Headers**:
  - `Authorization: Bearer <JWT_TOKEN_WITH_ADMIN_ROLE>`
- **Responses**:
  - **200 OK**:
    ```json
    {
      "message": "Usuario aprobado correctamente.",
      "uid": "u-1719000000000",
      "status": "active"
    }
    ```
  - **403 Forbidden** (Authenticated user is not an admin/super_admin):
    ```json
    {
      "error": "Acceso denegado.",
      "code": "FORBIDDEN"
    }
    ```

---

## 5. Verification Method

To verify the schemas and integration:
1. **Type Checking**: Run `npm run typecheck` in the root folder to confirm all frontend typescript structures compile without issue.
2. **Schema Validation**: Run SQLite in-memory DB or temporary file and copy/paste either Option A or Option B SQL schemas.
   ```powershell
   sqlite3 test.db
   # Paste DDL here to ensure SQLite syntax is correct.
   ```
3. **API Integrity**: Check imports of type `User` and `Role` in `src/types/models.ts` to ensure the API output JSON fields align 100% with the React client interfaces.
