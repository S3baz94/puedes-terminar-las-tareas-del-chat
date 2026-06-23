# Lanzamiento PWA

La aplicacion ya tiene los archivos necesarios para lanzarse como PWA, pero el modo PWA queda apagado por defecto.

## Estado actual

- Manifest listo en `public/manifest.webmanifest`.
- Icono base listo en `public/pwa-icon.svg`.
- Service worker listo en `public/service-worker.js`.
- Pantalla offline lista en `public/offline.html`.
- Registro controlado por `VITE_ENABLE_PWA`.

Mientras `VITE_ENABLE_PWA` no sea `true`, la app no inyecta el manifest ni registra el service worker.

## Activarla cuando sea el momento

1. En Vercel, abre el proyecto `puedes-terminar-las-tareas-del-chat`.
2. Ve a Settings > Environment Variables.
3. Agrega:

```text
VITE_ENABLE_PWA=true
```

4. Redespiega produccion.
5. Abre la app en Chrome o Edge y revisa la opcion de instalar.

## Recomendacion antes del lanzamiento publico

Crear iconos PNG finales en 192x192, 512x512 y maskable 512x512 para una instalacion mas pulida en Android y escritorio. El SVG actual deja la base funcional lista sin activar la PWA todavia.
