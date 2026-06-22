# Handoff Report - Integration Strategy (Milestone 1)

## 1. Observation

- **`package.json` (lines 6-36)**:
  - Scripts:
    ```json
    "scripts": {
      "dev": "vite --host 127.0.0.1 --configLoader runner",
      "build": "tsc -b && vite build --configLoader runner",
      "preview": "vite preview --host 127.0.0.1 --configLoader runner",
      "typecheck": "tsc -b --pretty"
    }
    ```
  - Current Dependencies: Already includes `"better-sqlite3": "^12.11.1"`, `"express": "^5.2.1"`, `"concurrently": "^10.0.3"`, `"cors": "^2.8.6"`, `"bcryptjs": "^3.0.3"`, and `"jsonwebtoken": "^9.0.3"`.
- **`vite.config.mjs` (lines 41-53)**:
  - Current dev server settings:
    ```javascript
    server: {
      host: '127.0.0.1',
      port: 5173,
      fs: {
        allow: [projectRoot],
        strict: true,
      },
    }
    ```
- **`vercel.json` (lines 5-11)**:
  - Current rewrites rule:
    ```json
    "rewrites": [
      {
        "source": "/((?!assets|api|favicon.ico).*)",
        "destination": "/index.html"
      }
    ]
    ```
- **`src/constants/mockData.ts`**:
  - Contains TypeScript exports for `demoCredentials` (emails and plain text passwords) and mock data arrays (`mockUsers`, `mockGroups`, `mockContent`, `mockPrayerRequests`, `mockEvents`, `mockPastoralNotes`, `mockDonations`, `mockLiveStream`, `mockMessages`, `mockNotifications`).
- **`src/types/models.ts`**:
  - Defines the data structures. Columns with arrays/objects (e.g. `User.ministry`, `User.groupIds`, `User.privacySettings`) will need serialization/deserialization when stored in SQLite.

---

## 2. Logic Chain

1. **Development Concurrency**:
   - To run the backend and frontend concurrently in development, `package.json` needs to start both the Vite dev server (on port `5173`) and the Express server (e.g., on port `3001`).
   - Using the pre-installed `concurrently` package, we can define a main `"dev"` script that runs `"dev:frontend"` and `"dev:backend"`.
   - Since the Express server needs to read `src/constants/mockData.ts` (which is written in TypeScript and imports other types), running Node directly will fail. We should use `tsx` (TypeScript Execute) as a runner/watcher in development (`npx tsx watch server/index.js`) to parse and load TypeScript files on-the-fly without a pre-compile step.

2. **Frontend-Backend Integration (API Proxying)**:
   - Frontend stores (Zustand) make API requests to relative paths (e.g., `/api/auth/login`).
   - During local development, the frontend runs on `http://127.0.0.1:5173` and the backend on `http://127.0.0.1:3001`.
   - We must configure the `server.proxy` setting in `vite.config.mjs` to rewrite and forward `/api` requests to the Express server.

3. **Vercel Serverless Routing**:
   - On Vercel, the backend will run as a Serverless Function. Vercel automatically exposes files in the root-level `api/` directory as serverless endpoints.
   - We will create `api/index.js` at the root that imports the Express app from `server/index.js` and exports it as a handler.
   - We must update `vercel.json` rewrites. We add a rule that directs `/api/(.*)` requests to our serverless function `api/index.js`. This rule must precede the SPA catch-all rule `"/((?!assets|api|favicon.ico).*)"` to ensure API calls are processed correctly.

4. **Seeding Strategy & SQLite Storage**:
   - **Storage Constraint**: The Vercel runtime file system is read-only, except for `/tmp`. If we configure SQLite to save to a file in the project directory, it will fail to open or write on Vercel.
   - **Resolution**: In `server/database.js`, we dynamically determine the SQLite path: use `:memory:` (in-memory, ephemeral) if running on Vercel (`process.env.VERCEL` is defined), and a local persistent file (`server/database.db`) in development.
   - **Seeding flow**: On server start, after opening the database, we verify if the `users` table is empty. If it is, we import mock data from `src/constants/mockData.ts`.
   - **Password Security**: In `mockData.ts`, `demoCredentials` has plain text passwords, but the database must store hashed passwords. We will map each user to their credential in `demoCredentials` (by email) and hash the password using `bcryptjs.hashSync()` before saving.

---

## 3. Caveats

- **Database Ephemerality**: In Vercel, the database is in-memory or in `/tmp`. This means database state is ephemeral; it will reset whenever the serverless function cold-starts or scales. For a production persistence database, a managed cloud database (e.g., PostgreSQL) or hosting on a persistent platform (Render, Railway, Fly.io) is required.
- **Native Binaries on Vercel**: `better-sqlite3` uses native C++ bindings. Vercel compiles these during deployment. If Vercel encounters compilation issues, an alternative driver like `sqlite` / `sqlite3` (pure JS fallback) or a WebAssembly-based SQLite driver could be considered.
- **Vercel API route mapping**: Wildcard API routing relies on the rewrite rule in `vercel.json` pointing `/api/(.*)` to `api/index.js`.

---

## 4. Conclusion

The integration strategy is feasible using the existing packages and a few adjustments. We recommend the following design for the implementation stage (Milestone 2):

### A. Dependency Updates (`package.json`)
Add `tsx` as a devDependency to run the backend in development:
```bash
npm install --save-dev tsx @types/express @types/cors @types/bcryptjs @types/jsonwebtoken
```
Update `"scripts"` to run concurrently:
```json
"scripts": {
  "dev:frontend": "vite --host 127.0.0.1 --configLoader runner",
  "dev:backend": "tsx watch server/index.js",
  "dev": "concurrently -n \"frontend,backend\" -c \"cyan,magenta\" \"npm run dev:frontend\" \"npm run dev:backend\"",
  "build": "tsc -b && vite build --configLoader runner",
  "preview": "vite preview --host 127.0.0.1 --configLoader runner",
  "typecheck": "tsc -b --pretty",
  "start": "node server/index.js"
}
```

### B. Vite Dev Proxy (`vite.config.mjs`)
Under the `server` block, add `proxy`:
```javascript
    server: {
      host: '127.0.0.1',
      port: 5173,
      fs: {
        allow: [projectRoot],
        strict: true,
      },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
```

### C. Vercel Router Settings (`vercel.json`)
Update `vercel.json` to configure both API proxying and client SPA routing:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/((?!assets|api|favicon.ico).*)",
      "destination": "/index.html"
    }
  ]
}
```

### D. Serverless Function Bridge (`api/index.js` - at root)
Create a bridge file to deploy Express on Vercel:
```javascript
import app from '../server/index.js';

export default app;
```

### E. Express Server Entry Point (`server/index.js`)
Create the Express server file, exporting `app` and only listening when not on Vercel:
```javascript
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database.js';
// Import other route handlers...

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Database & Seed
initializeDatabase();

// Define routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
// app.use('/api/auth', authRouter);
// app.use('/api', appRouter);

// Local listener
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Express server running on http://127.0.0.1:${PORT}`);
  });
}

export default app;
```

### F. SQLite Connection & Seeding Design (`server/database.js`)
Initialize sqlite dynamically and import typescript mockData for seeding:
```javascript
import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  demoCredentials,
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
} from '../src/constants/mockData.ts';

const isVercel = !!process.env.VERCEL;
const dbPath = isVercel ? ':memory:' : path.resolve(process.cwd(), 'server/database.db');

export const db = new Database(dbPath);

export function initializeDatabase() {
  // 1. Create Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      displayName TEXT,
      photoURL TEXT,
      role TEXT,
      phone TEXT,
      city TEXT,
      country TEXT,
      birthDate TEXT,
      baptismDate TEXT,
      favoriteVerse TEXT,
      testimony TEXT,
      ministry TEXT,      -- stored as JSON array
      groupIds TEXT,      -- stored as JSON array
      leaderId TEXT,
      status TEXT,
      spiritualStatus TEXT,
      privacySettings TEXT, -- stored as JSON object
      onboardingCompleted INTEGER,
      lastActiveAt TEXT,
      createdAt TEXT,
      passwordHash TEXT
    );
    
    -- Create other tables: groups, content, prayer_requests, events, pastoral_notes, donations, messages, notifications, livestream, settings...
  `);

  // 2. Auto-seed if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('Database is empty. Seeding mock data...');

    const insertUser = db.prepare(`
      INSERT INTO users (
        uid, email, displayName, photoURL, role, phone, city, country,
        birthDate, baptismDate, favoriteVerse, testimony, ministry, groupIds,
        leaderId, status, spiritualStatus, privacySettings, onboardingCompleted,
        lastActiveAt, createdAt, passwordHash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const user of mockUsers) {
        // Find credentials to obtain password
        const creds = demoCredentials.find(c => c.email === user.email);
        const plainPassword = creds ? creds.password : 'Password123!';
        const passwordHash = bcrypt.hashSync(plainPassword, 10);

        insertUser.run(
          user.uid,
          user.email,
          user.displayName,
          user.photoURL || null,
          user.role,
          user.phone,
          user.city,
          user.country,
          user.birthDate || null,
          user.baptismDate || null,
          user.favoriteVerse || null,
          user.testimony || null,
          JSON.stringify(user.ministry),
          JSON.stringify(user.groupIds),
          user.leaderId || null,
          user.status,
          user.spiritualStatus,
          JSON.stringify(user.privacySettings),
          user.onboardingCompleted ? 1 : 0,
          user.lastActiveAt,
          user.createdAt,
          passwordHash
        );
      }
      
      // Similar transaction blocks to seed groups, content, events, etc.
    })();
    console.log('Seeding completed successfully!');
  }
}
```

---

## 5. Verification Method

To verify compilation and bundling settings run clean:

1. **Verify TypeScript compilation**:
   - Run `npm run typecheck` or `npx tsc -b --pretty` to verify that there are no compilation errors in the codebase.
2. **Verify Bundling**:
   - Run `npm run build` to verify that the frontend compiles cleanly and creates the `dist/` production folder.
3. **Local Dev Test Plan**:
   - Run `npm run dev`.
   - Verify that concurrently starts both the frontend and backend servers.
   - Verify console outputs show:
     - `Vite server running on http://127.0.0.1:5173`
     - `Express server running on http://127.0.0.1:3001`
     - `Database is empty. Seeding mock data...` followed by `Seeding completed successfully!`
   - Open browser at `http://127.0.0.1:5173/` and verify that the page loads correctly.
