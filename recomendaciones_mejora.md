# Recomendaciones de Mejora - Congregacion Digital

Fecha: 2026-06-22

## Resumen

Congregacion Digital ya avanzo de prototipo visual a una herramienta con backend real, persistencia SQLite, autenticacion JWT, roles, navegacion SPA y modulos interactivos para administradores, lideres y miembros.

La prioridad ahora no es agregar muchas pantallas nuevas, sino estabilizar el producto, mejorar la experiencia diaria por rol y preparar el camino para produccion real.

## Prioridad Alta

### 1. Pruebas visuales por rol

Crear una rutina de verificacion en navegador para:

- Login como administrador.
- Login como lider.
- Login como miembro.
- Navegacion completa del sidebar por cada rol.
- Formularios clave: donacion, reunion de celula, perfil, contenido y eventos.

Motivo: el backend compila y responde, pero falta una prueba e2e que confirme que cada flujo se ve y funciona bien en pantalla.

### 2. Arreglar pruebas de store fuera del navegador

`verification/test_stores.ts` falla cuando se ejecuta en Node porque los stores usan `fetch('/api/...')` con rutas relativas. En Node esas rutas no tienen origen base.

Opciones:

- Definir una URL base configurable para API, por ejemplo `VITE_API_BASE_URL`.
- Mockear `fetch` en pruebas de store.
- Ejecutar esas pruebas dentro de un entorno de navegador con Playwright.

### 3. Separar entorno demo de entorno produccion

Hoy la app mezcla datos demo, SQLite local y configuracion pensada para prototipo.

Recomendacion:

- Mantener SQLite para desarrollo local.
- Preparar Postgres/Neon/Supabase para produccion.
- Documentar credenciales demo y variables de entorno necesarias.
- Evitar que pruebas modifiquen datos permanentes sin restauracion automatica.

### 4. Hacer idempotente `server/test_verify.js`

El script registra usuarios y cambia configuracion. Conviene que:

- Use emails unicos por ejecucion.
- Limpie datos creados al finalizar.
- Restaure `organizationName` y `themeColor` automaticamente.
- Falle con codigo de salida distinto de cero si alguna verificacion no cumple.

## Prioridad Media

### 5. Optimizar el bundle principal

El build muestra advertencia por un archivo JavaScript mayor a 500 kB.

Recomendacion:

- Cargar modulos por rol con `React.lazy`.
- Separar paginas de admin, lider y miembro.
- Revisar dependencias pesadas como Firebase y Stripe para cargarlas solo cuando se necesiten.

### 6. Mejorar estados de carga y error

Agregar estados claros para:

- Cargando datos iniciales.
- Sesion expirada.
- Error de red.
- Guardado exitoso.
- Formulario con validaciones incompletas.

Esto ayuda mucho si la herramienta se usa en iglesias o equipos no tecnicos.

### 7. Estandarizar textos y acentos

Ya se corrigieron etiquetas visibles como `Oracion`, `Analiticas` y `Gestion`. Conviene revisar el resto de la aplicacion para mantener un espanol consistente.

Recomendacion:

- Definir un glosario de terminos: celula, lider, ofrenda, devocional, pastoral, en vivo.
- Evitar mezclar ingles tecnico en pantallas de usuario.

### 8. Confirmaciones para acciones sensibles

Agregar confirmacion antes de:

- Suspender usuarios.
- Cambiar roles.
- Eliminar contenido.
- Eliminar eventos.
- Cambiar configuracion general.

Esto reduce errores humanos en administracion.

## Prioridad Baja

### 9. Dashboard mas accionable

Los dashboards pueden evolucionar de resumen visual a panel de trabajo.

Ideas:

- Tareas pendientes por rol.
- Alertas relevantes.
- Proximas reuniones.
- Nuevos usuarios pendientes.
- Donaciones recientes.
- Solicitudes de oracion sin seguimiento.

### 10. Registro de actividad

Crear un historial de acciones:

- Quien aprobo usuarios.
- Quien cambio roles.
- Quien creo eventos.
- Quien marco asistencia.
- Quien actualizo configuracion.

Esto aporta confianza y trazabilidad.

### 11. Accesibilidad

Revisar:

- Contraste de colores.
- Foco visible en botones y enlaces.
- Navegacion con teclado.
- Etiquetas de formularios.
- Mensajes de error asociados a campos.

### 12. Seguridad de produccion

Antes de usar con datos reales:

- Mover `JWT_SECRET` a variable de entorno obligatoria.
- Usar HTTPS en produccion.
- Configurar expiracion y renovacion de token.
- Validar inputs del backend.
- Limitar intentos de login.
- Agregar proteccion CSRF si se usan cookies en el futuro.

## Mejoras Especificas por Rol

### Administrador

- Vista de usuarios pendientes con filtros rapidos.
- Exportacion de donaciones y asistencia.
- Reporte de actividad semanal.
- Configuracion guiada de transmision en vivo.

### Lider

- Agenda clara de reuniones.
- Seguimiento pastoral por miembro.
- Alertas cuando alguien falta varias veces.
- Plantillas para notas pastorales.

### Miembro

- Diario devocional persistente y consultable.
- Historial real de donaciones con recibos.
- Confirmacion de asistencia a reuniones.
- Seguimiento de solicitudes de oracion.

## Recomendacion de Ruta

1. Cerrar pruebas e2e por rol.
2. Hacer idempotente el script backend de verificacion.
3. Preparar base de datos de produccion.
4. Optimizar carga por roles.
5. Mejorar accesibilidad y confirmaciones.
6. Implementar auditoria de actividad.

Con esto, la herramienta pasa de prototipo avanzado a base confiable para una primera prueba real con usuarios.
