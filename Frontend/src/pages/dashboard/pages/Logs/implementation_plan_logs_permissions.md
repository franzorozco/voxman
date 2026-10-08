# Plan de Seguridad para Auditoría (Logs)

Vamos a implementar el sistema de permisos de roles (Spatie) para restringir el acceso a la pantalla de Auditoría (Logs), protegiéndolo tanto a nivel de API (Backend) como a nivel visual (Frontend).

## Propuesta de Cambios

### Base de Datos (Seeders)
- [MODIFY] `Backend/database/seeders/RolePermissionSeeder.php`
  - Agregar el nuevo permiso `view_audit_logs`.
  - Asignarlo automáticamente al rol de **Owner** (por defecto) y al rol de **Administrador**.

### Backend (API Routes)
- [MODIFY] `Backend/routes/api.php`
  - Aplicarle el middleware protector a la ruta: `Route::get('/logs', ...)->middleware('permission:view_audit_logs');`

### Frontend (Rutas y Menú)
- [MODIFY] `Frontend/src/routes/AppRouter.jsx`
  - Envolver la ruta de `<Logs />` con `<ProtectedRoute requiredPermission="view_audit_logs">` para evitar el acceso por URL directa si no se tienen permisos.
- [MODIFY] `Frontend/src/pages/dashboard/Dashboard.jsx`
  - Cambiar el requerimiento del botón en la barra lateral (Sidebar) para que evalúe explícitamente `view_audit_logs` en vez de usar el permiso genérico de configuraciones, de forma que el botón desaparezca si el usuario no tiene permisos.

## Plan de Verificación

### Pruebas Automatizadas
- `php artisan db:seed --class=RolePermissionSeeder` para inyectar el permiso a la base de datos sin alterar el resto de configuraciones.

### Verificación Manual
- Iniciar sesión como Owner/Admin: se debe visualizar el botón y acceder a los logs con normalidad.
- Iniciar sesión como Vendedor u otro rol sin permiso: el botón de Logs debe desaparecer y la ruta directa `/dashboard/logs` debe redirigir fuera por falta de permisos, protegiendo así los datos sensibles del servidor.
