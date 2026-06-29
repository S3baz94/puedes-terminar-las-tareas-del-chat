# Project: Congregación Digital - Pre-Production Audit Remediation

## Architecture
The application is a React 18 SPA built with Vite and TypeScript, backed by an Express server with SQLite storage. The state is managed locally via Zustand stores.
To address the audit findings, we will harden the security settings (JWT, localStorage partialize, Vercel headers), improve performance (code-splitting, Zustand selectors, bcrypt hash deferral), achieve WCAG 2.1 AA accessibility compliance, resolve UX defects, align PWA configuration, and clean up TypeScript/unused files.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Security & PWA Hardening | Refuse boot on missing JWT secret, partialize Zustand store, add security headers, add manifest id, apple-touch-icon, SW cache version, and vercel rewrites | None | DONE |
| 2 | Accessibility Compliance | Fix WCAG 2.1 AA contrast for text-muted, badges, buttons; enable keyboard focus for verses and Toggles; link errors via aria-describedby; add tabs roles/labels | M1 | DONE |
| 3 | Performance Improvements | Implement route-level code splitting, convert store access to selectors (useShallow), defer/seed bcrypt hashing off start path | M2 | DONE |
| 4 | UX/Design & Component Extraction | Fix grid column breakpoints to 1024px, add /admin/perfil, clickable TopBar avatar dropdown, sidebar opacity, use React refs instead of DOM searches, extract page sub-modules | M3 | DONE |
| 5 | Code Cleanup & TypeScript Fixes | Remove dead code files/exports/imports, resolve circular dependency, fix 4 stubs with proper UI, resolve all 24 'as any' bypasses, compile check | M4 | DONE |
| 6 | E2E Testing & Verification | Validate all builds, check typescript type safety, run Forensic Auditor to verify compliance | M5 | DONE |

## Interface Contracts
- **Auth Endpoint**: Express JWT token validation.
- **Zustand stores**:
  - `authStore`: Handles authentication credentials.
  - `appStore`: Connects with backend for application database, persistence excludes sensitive collections (donations, users, pastoralNotes, messages).
