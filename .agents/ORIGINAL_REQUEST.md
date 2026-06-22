# Original User Request

## Initial Request — 2026-06-22T04:22:55Z

Actualización y despliegue del prototipo interactivo de Congregación Digital en la plataforma Vercel del usuario para que los cambios se reflejen en vivo en el enlace existente.

Working directory: C:\Users\Sebastián\Documents\Codex\2026-06-03\puedes-terminar-las-tareas-del-chat
Integrity mode: demo

## Requirements

### R1. Despliegue en la Organización Original de Vercel
Se debe actualizar la aplicación en la plataforma Vercel utilizando la organización original (`team_5RP6S9PfYFTmckK0AdEbPaKT`) y el proyecto (`puedes-terminar-las-tareas-del-chat`), asegurándose de no romper la vinculación existente en el archivo `.vercel/project.json`.

### R2. Integridad de la Aplicación e Interactividad
La aplicación debe mantener las mejoras funcionales de Zustand y `localStorage` en el cliente. La base de datos simulada localmente debe responder a todas las acciones de los portales de Miembro, Líder y Administrador.

## Acceptance Criteria

### Despliegue y URL
- [ ] La compilación se completa sin errores de TypeScript (`npx tsc -b --pretty`) y se genera la carpeta `dist/`.
- [ ] La aplicación se despliega en producción en Vercel, de modo que al visitar la URL original (https://puedes-terminar-las-tareas-del-chat.vercel.app/) se muestren los portales y las interacciones Zustand persistentes (donaciones, chat, etc.).
- [ ] Las rutas SPA cargan correctamente y no producen errores 404 al recargar directamente las páginas internas desde Vercel (por ejemplo `/admin/usuarios`).

## Follow-up — 2026-06-22T09:30:39-05:00

Implementar un backend funcional para la aplicación web "Congregación Digital" (React + Vite + Zustand), reemplazando la persistencia local de localStorage por una base de datos real con API. Todos los botones e interacciones existentes deben funcionar con persistencia en el servidor. Al terminar, hacer commit y push de todos los cambios al repositorio GitHub del usuario.

Working directory: C:\Users\Sebastián\Documents\Codex\2026-06-03\puedes-terminar-las-tareas-del-chat
Integrity mode: demo

GitHub repo: https://github.com/S3baz94/puedes-terminar-las-tareas-del-chat.git (branch: main, remote: origin)

## Requirements

### R1. API Backend con Base de Datos Real
La aplicación necesita un backend funcional que persista datos en una base de datos real (no localStorage). Debe cubrir todas las entidades del sistema: usuarios, grupos, contenido, peticiones de oración, eventos, notas pastorales, donaciones, mensajes de chat, configuración de transmisión en vivo, notificaciones y configuración de la organización (nombre y color de tema). La base de datos debe precargarse con los datos demo existentes en `src/constants/mockData.ts` como datos semilla.

### R2. Integración Frontend ↔ Backend
El frontend React existente debe conectarse al nuevo backend. Todos los botones e interacciones actualmente funcionales (donaciones, chat, oración, aprobación de usuarios, RSVP, asistencia, notas pastorales, publicación de contenido, creación de eventos, registro de usuarios, personalización de color de marca, etc.) deben seguir funcionando de manera idéntica pero ahora persistiendo datos en el servidor en lugar de localStorage.

### R3. Autenticación
El sistema de login demo actual (que usa credenciales hardcodeadas en mockData) debe ser reemplazado o complementado con un flujo de autenticación real a través del backend (por ejemplo, JWT o sesiones). Las tres credenciales demo existentes (admin, líder, miembro) deben seguir funcionando.

### R4. Despliegue y Git
Al completar los cambios, se debe hacer `git add`, `git commit` y `git push` al repositorio remoto `origin` (branch `main`) en https://github.com/S3baz94/puedes-terminar-las-tareas-del-chat.git. La aplicación debe seguir siendo desplegable en Vercel sin romper el archivo `.vercel/project.json` existente.

## Acceptance Criteria

### Compilación y Build
- [ ] `npm run build` (o el equivalente del monorepo) se completa sin errores de TypeScript ni errores de bundling.
- [ ] El servidor backend arranca sin errores con un solo comando.

### Funcionalidad de API
- [ ] Existe un endpoint o mecanismo de API para cada operación CRUD: usuarios, donaciones, peticiones de oración, eventos, contenido, notas pastorales, mensajes de chat, configuración de transmisión, y configuración de la organización.
- [ ] Los datos demo (mockData) se cargan como datos semilla al inicializar la base de datos.
- [ ] Registrar un nuevo usuario desde `/registro` lo persiste en la base de datos y aparece en el panel de aprobaciones del administrador.
- [ ] Enviar una donación desde el portal de miembro la persiste y aparece en el historial de finanzas del administrador.
- [ ] Enviar un mensaje de chat lo persiste y es visible al recargar la página.

### Autenticación
- [ ] El login con las tres credenciales demo funciona y devuelve un token o sesión válida.
- [ ] Las rutas protegidas del frontend no son accesibles sin autenticación.

### Git Push
- [ ] Todos los cambios nuevos están commiteados y pusheados al branch `main` del repositorio `origin`.
