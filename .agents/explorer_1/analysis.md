# Codebase Exploration and Analysis Report

This report documents the architectural structure, routing logic, sidebar navigation system, and role management mechanisms of the **Congregación Digital** application.

---

## 1. Project Structure and Routing

### 1.1 Project Structure
The project is split into a modern decoupled architecture consisting of a React-based frontend and an Express-based backend serving a persistent SQLite database.

```
puedes-terminar-las-tareas-del-chat/
├── server/                    # Express + SQLite Backend
│   ├── index.js               # Express application, REST endpoints, JWT auth, and CORS
│   ├── database.js            # SQLite database schema, connections, and seeding logic
│   ├── mockData.js            # Seed/mock data compiled for backend initialization
│   └── database.db            # SQLite database file (generated)
├── src/                       # React + TypeScript Frontend
│   ├── main.tsx               # Frontend entry point (renders App.tsx)
│   ├── App.tsx                # App root component (renders AppRouter)
│   ├── components/            # Reusable UI elements
│   │   ├── common/            # Shared primitives (Button, Card, DataTable, etc.)
│   │   ├── layout/            # Layout shell components (AppLayout, Sidebar, TopBar)
│   │   ├── leader/            # Specific views for Leader role
│   │   └── member/            # Specific views for Member role
│   ├── constants/             # Central configurations (routes.ts, roles.ts, mockData.ts)
│   ├── hooks/                 # Custom React hooks (useAuth, useRole, useNotifications)
│   ├── pages/                 # Full view components grouped by role/access
│   │   ├── admin/             # Admin-specific modules and dashboard
│   │   ├── auth/              # Authentication flows (Login, Register, Onboarding, etc.)
│   │   ├── leader/            # Leader modules and dashboard
│   │   ├── member/            # Member modules and dashboard
│   │   └── shared/            # Shared modules (Messages, Directory, Testimonies, Calendar)
│   ├── routes/                # Client-side router configuration (AppRouter, PrivateRoute, RoleRoute)
│   ├── store/                 # Zustand state stores (appStore, authStore, uiStore)
│   └── types/                 # TypeScript interfaces and type definitions (models.ts)
```

### 1.2 Routing Implementation
Routing is implemented on two levels: frontend client-side routing and backend REST API routing.

#### 1.2.1 Frontend Client-Side Routing
Managed via `react-router-dom` in `src/routes/AppRouter.tsx`.

* **Public Routes**: Accessible by unauthenticated visitors (`/login`, `/registro`, `/olvide-contrasena`).
* **Private Route Guarding**: Wrapped under `<PrivateRoute />` (in `src/routes/PrivateRoute.tsx`) which evaluates `user` state from `useAuthStore`. If unauthenticated, it redirects to `/login`, preserving previous location in state.
* **Layout Wrapper**: Protected pages are wrapped within `<AppLayout />` (in `src/components/layout/AppLayout.tsx`) which manages initialization bootstraps and mounts the `<Sidebar />`, `<TopBar />`, and `<Outlet />`.
* **Role-Based Route Guarding**: Handled by the `<RoleRoute roles={['role1', 'role2']} />` component (in `src/routes/RoleRoute.tsx`). It checks if the current user's role is in the authorized list. If not, it redirects the user to their designated role home page using the `getHomePath(role)` helper.
* **Default Homepage Redirect**: The root route `/` renders `<HomeRedirect />` which navigates users to their role-specific landing path (e.g., `/admin` for administrators, `/leader` for cell leaders, and `/member` for general members).

#### 1.2.2 Backend API Routing
Defined in `server/index.js`, mapping REST endpoints under `/api`.
* **Authentication**: Token-based security using JWT. Request header `Authorization: Bearer <token>` is parsed by the `authenticateToken` middleware.
* **Role Authorization**: The `requireRole(roles)` middleware on the server blocks requests where `req.user.role` does not match the allowed roles list, returning a `403 Forbidden` response.

---

## 2. Sidebar Structure and Proposed Redesign

### 2.1 Current Sidebar Structure
The sidebar is defined in `src/components/layout/Sidebar.tsx` and pulls navigation items from `allNavItems` in `src/constants/routes.ts`.

* **Dynamic Filtering**: The function `groupByCategory` filters `allNavItems` based on the user's role:
  ```typescript
  function groupByCategory(items: NavItem[], role: Role) {
    const filtered = items.filter((item) => item.roles.includes(role));
    return {
      general: filtered.filter((item) => item.category === 'general'),
      crecimiento: filtered.filter((item) => item.category === 'crecimiento'),
      gestion: filtered.filter((item) => item.category === 'gestion'),
    };
  }
  ```
* **Section Mapping**: Items are grouped and rendered in three sections:
  1. **General** (renders `grouped.general`)
  2. **Vida Espiritual** (renders `grouped.crecimiento` where category is `'crecimiento'`)
  3. **Gestión y Ministerio** (renders `grouped.gestion` where category is `'gestion'`)
* **SPA transitions**: Navigation items are wrapped in `<NavLink>` from `react-router-dom`. When clicked, navigation is intercepted and routed client-side, updating the `<Outlet />` element dynamically *without triggering a page reload*.

### 2.2 Critical Analysis & Proposed Redesign
While the sidebar structure is already categorizing items as required, a clean audit reveals opportunities for refinement:

#### 1. Role-Specific Gaps in Categories
* **Administrators** currently have zero items categorized under **Vida Espiritual** (`crecimiento`). As active church members, they should have access to spiritual tools (e.g., Biblia, Devocional, Oracion, Dar).
* **Visitor Role**: There are currently no items defined for the `visitor` role in `allNavItems` or paths mapped in `AppRouter.tsx`.

#### 2. Duplicate Items & Categorization Cleaning
* **"En vivo"**:
  * Admin's "En vivo" (`/admin/en-vivo`): configures livestream, category `'gestion'`.
  * Member's "En vivo" (`/member/en-vivo`): watches livestream, category `'crecimiento'` (though in `routes.ts` it is listed twice with differing categories).
* **"Perfil"**:
  * Member/Leader profile views are mapped under the "General" category. It may be cleaner to keep them in "General" or move them to a profile action header in the TopBar.

#### 3. Recommended Sidebar Redesign Proposal
We can refine `src/constants/routes.ts` to ensure clean distribution of items:

| Label | Route | Icon | Roles | Category |
| :--- | :--- | :--- | :--- | :--- |
| **Inicio (Admin)** | `/admin` | `dashboard` | `['super_admin', 'admin']` | `general` |
| **Inicio (Leader)** | `/leader` | `dashboard` | `['leader']` | `general` |
| **Inicio (Member)** | `/member` | `home` | `['member']` | `general` |
| **Mensajes** | `/shared/mensajes` | `message` | `['super_admin', 'admin', 'leader', 'member']` | `general` |
| **Calendario** | `/shared/calendario` | `calendar` | `['super_admin', 'admin', 'leader', 'member']` | `general` |
| **Directorio** | `/shared/directorio` | `directory` | `['super_admin', 'admin', 'leader', 'member']` | `general` |
| **Testimonios** | `/shared/testimonios` | `spark` | `['super_admin', 'admin', 'leader', 'member']` | `general` |
| **Alertas** | `/shared/notificaciones` | `bell` | `['super_admin', 'admin', 'leader', 'member']` | `general` |
| **Perfil** | `/*/perfil` | `profile` | `['leader', 'member']` | `general` |
| **Devocional** | `/member/devocional` | `content` | `['member', 'admin', 'leader']` | `crecimiento` |
| **Biblia** | `/member/biblia` | `book` | `['member', 'admin', 'leader']` | `crecimiento` |
| **Oración (Member)** | `/member/oracion` | `prayer` | `['member']` | `crecimiento` |
| **Oración (Leader)** | `/leader/oracion` | `prayer` | `['leader']` | `crecimiento` |
| **Recursos** | `/leader/recursos` | `library` | `['leader']` | `crecimiento` |
| **Dar / Ofrendar** | `/member/dar` | `finance` | `['member']` | `crecimiento` |
| **En vivo (Member)** | `/member/en-vivo` | `live` | `['member']` | `crecimiento` |
| **Usuarios** | `/admin/usuarios` | `users` | `['super_admin', 'admin']` | `gestion` |
| **Contenido** | `/admin/contenido` | `content` | `['super_admin', 'admin']` | `gestion` |
| **Eventos** | `/admin/eventos` | `calendar` | `['super_admin', 'admin']` | `gestion` |
| **Analíticas** | `/admin/analiticas` | `analytics` | `['super_admin', 'admin']` | `gestion` |
| **Finanzas** | `/admin/finanzas` | `finance` | `['super_admin', 'admin']` | `gestion` |
| **En vivo (Admin)** | `/admin/en-vivo` | `live` | `['super_admin', 'admin']` | `gestion` |
| **Ajustes** | `/admin/configuracion` | `settings` | `['super_admin', 'admin']` | `gestion` |
| **Mi grupo** | `/leader/mi-grupo` | `users` | `['leader']` | `gestion` |
| **Pastoral** | `/leader/pastoral` | `heart` | `['leader']` | `gestion` |
| **Reuniones** | `/leader/reuniones` | `checklist` | `['leader']` | `gestion` |
| **Reportes** | `/leader/reportes` | `analytics` | `['leader']` | `gestion` |
| **Mis grupos** | `/member/grupos` | `users` | `['member']` | `gestion` |

This structure guarantees that all options from the acceptance criteria are mapped, categories are populated appropriately for all roles, and components transition instantly client-side without page reloads.

---

## 3. Role Definition, Mapping, and Switching

### 3.1 Role Definition
Roles are defined in the following locations:
* **TypeScript Types**: In `src/types/models.ts` line 1:
  `export type Role = 'super_admin' | 'admin' | 'leader' | 'member' | 'visitor';`
* **Labels mapping**: In `src/constants/roles.ts` line 3:
  `roleLabels` translates roles to Spanish strings (`super_admin: 'Super admin'`, `admin: 'Admin'`, `leader: 'Lider'`, `member: 'Miembro'`, `visitor: 'Visitante'`).
* **Home path mapping**: In `src/constants/roles.ts` line 11:
  `roleHomePaths` defines the redirect landing target for each role.
* **Database Check Constraint**: In `server/database.js` line 45, SQLite enforces database-level integrity:
  `role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'leader', 'member', 'visitor'))`

### 3.2 Role Mapping/Switching Mechanism
Role switching is fully integrated, reactive, and persists across sessions via API updates.

#### 1. Triggering the Switch (Admin Action)
In `src/pages/admin/AdminModulePage.tsx`, the `usuarios` module lists members. The "Rol" column renders a dropdown:
```typescript
<select
  value={row.role}
  onChange={(e) => changeUserRole(row.uid, e.target.value)}
  className="..."
>
```
When changed, it executes `changeUserRole(userId, newRole)` in `src/store/appStore.ts`.

#### 2. Local State & API Synchronization
Inside `useAppStore.changeUserRole(userId, role)`:
* It issues a request to the backend: `PUT /api/users/${userId}/role` with `{ role }`.
* If successful, the store updates its local `users` list.
* If the user being modified is the currently authenticated user (`useAuthStore.getState().user.uid === userId`), it updates the `user` property inside the `useAuthStore` state.

#### 3. Reactive Routing & Layout Transitions
Updating the role triggers reactive state updates in the React tree:
* **Sidebar Update**: The `<Sidebar />` component re-evaluates `groupByCategory(allNavItems, user.role)` using the new role, updating the navigation links immediately.
* **Redirect / Guarding**: If the user is currently visiting a path restricted to their old role (e.g. `/admin/usuarios` and they were demoted to `member`), the outer wrapper `<RoleRoute roles={['super_admin', 'admin']} />` detects the role change, fails the check, and redirects them client-side to `getHomePath('member')` (which is `/member`) without a page reload.

#### 4. Backend Processing
In `server/index.js` line 839:
```javascript
app.put('/api/users/:uid/role', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
  const { uid } = req.params;
  const { role } = req.body;
  // Validates role against validRoles array
  // Updates the SQLite table 'users' with new role and lastActiveAt date
  // Returns { success: true }
});
```

---

## 4. Gaps and Caveats Identified

1. **Missing Visitor Interface**: A `visitor` role is defined in types and constraints. However, there is no landing page or routes mapped for visitors. If a visitor logs in, the app attempts to redirect them to `/publico` (defined in `roleHomePaths`), which will trigger a 404 Not Found since it is not defined in `AppRouter.tsx`.
2. **Missing Devocional / Biblia / Oración for Admin**: The admin role is not listed in `routes.ts` for these growth modules, meaning admins cannot access devotional content, read the Bible, or check prayer requests in their sidebar navigation.
3. **Internal CLI dependencies**: ripgrep (`grep`) is not available in the execution environment's shell PATH, requiring standard tools like file searches for pattern matches.
