## 2026-06-22T15:55:53Z

<USER_REQUEST>
Objective: Implement the SQLite backend server and API endpoints for 'Congregación Digital' following the technical design.
Working Directory: C:\Users\Sebastián\Documents\Codex\2026-06-03\puedes-terminar-las-tareas-del-chat\.agents\worker_backend_m2\
Inputs:
- Global PROJECT.md at project root
- Detailed technical design at C:\Users\Sebastián\Documents\Codex\2026-06-03\puedes-terminar-las-tareas-del-chat\.agents\orchestrator_backend_gen3\technical_design.md
- Explorer handoffs in .agents/explorer_milestone1_gen3_1/handoff.md and .agents/explorer_milestone1_gen3_2/handoff.md
Task Requirements:
1. Update package.json to include "tsx" as a devDependency, and add/modify dev, start, typecheck, build, and concurrent scripts as designed.
2. Update vite.config.mjs to add the proxy configuration from http://127.0.0.1:5173 to http://127.0.0.1:3001 for /api requests.
3. Update vercel.json to configure Vercel routing (proxying /api/* to /api/index.js and SPA routing for other pages).
4. Create the api/index.js root serverless function bridge file.
5. Create server/database.js which establishes the SQLite database (ephemeral :memory: if Vercel is active, local file server/database.db if not), runs the schema DDL to create all 19 tables and relationships (Option A normalized or Option B from technical design), and seeds initial data from src/constants/mockData.ts if the database is empty. Map passwords in demoCredentials to user emails and store them as hashed passwords using bcryptjs.
6. Create server/index.js and route handlers supporting all specified REST API routes (Auth, Admin, and App endpoints). Implement JWT signing on /login and JWT verification middleware on protected routes.
7. Verify compilation: Run the build check and type check scripts to verify that your changes compile successfully and do not break the TypeScript project.
8. Output a detailed handoff.md in your working directory summarizing:
   - What files were created or modified.
   - Database schema details and verification.
   - API endpoints verification results (run local test calls/scripts and capture output).
   - Build and type check status with command outputs.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
</USER_REQUEST>
