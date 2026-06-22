# Congregacion Digital

Prototipo web responsive para **Los Invisibles de Jesus**.

## Credenciales demo

| Rol | Email | Password |
| --- | --- | --- |
| Admin | admin@iglesia.com | Admin123! |
| Lider | lider@iglesia.com | Lider123! |
| Miembro | miembro@iglesia.com | Miembro123! |

## Ejecutar

```bash
npm install
npm run dev
```

Para revisar el build final:

```bash
npm run build
npm run preview
```

## Desplegar en Vercel

El proyecto ya incluye `vercel.json`, `buildCommand`, `outputDirectory` y soporte para rutas SPA.

1. Sube esta carpeta a un repositorio GitHub o impórtala como proyecto en Vercel.
2. Usa estos valores:
   - Framework: `Vite`
   - Build command: `npm run build`
   - Output directory: `dist`
3. Configura las variables de `.env.example` si quieres conectar Firebase y Stripe reales.

Nota: Firebase, Stripe, pagos, notificaciones y base de datos están en modo demo hasta configurar credenciales y backend.
