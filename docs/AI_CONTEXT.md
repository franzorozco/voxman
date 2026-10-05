# 🤖 VÓXMAN - Contexto para Inteligencias Artificiales (AI_CONTEXT)

> **⚠️ ATENCIÓN IA:** Si estás leyendo este archivo, estás asumiendo el rol de desarrollador de software para el proyecto VÓXMAN. Debes adherirte estrictamente a las reglas de arquitectura, convenciones de código y configuraciones de infraestructura detalladas aquí.

## 1. Descripción del Proyecto
**VÓXMAN** es un sistema ERP e E-commerce completo diseñado para una tienda de moda masculina. El sistema integra:
- **Tienda Pública (E-commerce):** Catálogo, carrito, pasarela de pagos y páginas informativas.
- **Dashboard Administrativo:** Gestión de inventario, productos, finanzas, nómina, roles y permisos.
- **POS (Punto de Venta):** Interfaz rápida para ventas físicas en sucursales.

## 2. Stack Tecnológico (Frontend)
- **Framework:** React 18+ con Vite.
- **Gestión de Estado:** Zustand (Almacenamiento global ligero y hooks personalizados).
- **Enrutamiento:** React Router DOM (v6+).
- **Estilos:** CSS puro / Módulos CSS.
- **Peticiones HTTP:** Axios (configurado en `src/api/client.js` con interceptores de autenticación).
- **Despliegue:** Cloudflare Pages (Unified Build vía `wrangler.json`).

## 3. Estructura de Carpetas (`Frontend/src/`)
- `/api`: Llamadas al backend divididas por dominio (admin, shop, auth).
- `/assets`: Imágenes estáticas, íconos y hojas de estilo globales.
- `/components`: Componentes reutilizables (UI, Layouts, Modales).
- `/pages`: Separación estricta por módulo:
  - `/auth`: Login, Registro, Recuperación.
  - `/dashboard`: Panel de administración (CRUDs, KPIs, inventario).
  - `/home`: Landing pages (Inicio, Nosotros, Entregas).
  - `/pos`: Interfaz del Punto de Venta.
  - `/shop`: Catálogo de E-commerce, carrito y checkout.
- `/routes`: `AppRouter.jsx` centraliza la navegación y protección de rutas.
- `/store`: Archivos de estado de Zustand (`authStore`, `shopSettingsStore`, etc.).
- `/utils`: Funciones de utilidad (imágenes, formateo de moneda, sanitización).

## 4. Infraestructura y Despliegue
- **Cloudflare Pages:** El frontend se despliega automáticamente en Cloudflare. 
- **Configuración Crítica (`wrangler.json`):** El proyecto usa Cloudflare Workers & Pages unificado. El comando de build es `npm run build` y la salida es `Frontend/dist`.
- **Dominio:** `voxman.shop` configurado a través de DNS proxy en Cloudflare. (Registros MX y TXT apuntan a Namecheap PrivateEmail).

## 5. Seguridad y Roles (RBAC)
La autenticación se maneja vía JWT y Zustand (`useAuthStore`).
- **Permisos Granulares:** En lugar de validar el rol "Administrador", el sistema valida permisos específicos en formato snake_case:
  - Ejemplos: `access_dashboard`, `sell_own_branch`, `sell_all_branches`, `view_products`, `manage_users`.
- **Rutas Protegidas:** Las rutas del dashboard usan validaciones de Zustand para redirigir si no hay permisos.

## 6. 🚨 Reglas de Oro para Modificar Código (CRÍTICO)
1. **CODIFICACIÓN DE ARCHIVOS (UTF-8 STRICT):** TODOS los archivos (`.jsx`, `.js`, `.css`) DEBEN guardarse en formato **UTF-8 sin BOM**. Vite/Rolldown en Cloudflare arrojará un error fatal (`stream did not contain valid UTF-8`) si se usa la codificación Windows-1252 (ANSI) u otra.
2. **No romper imports dinámicos:** Vite maneja la separación de código en el router. Mantén las importaciones limpias.
3. **Manejo del Estado Global:** Usa Zustand. No introduzcas Redux ni Context API innecesariamente. 
4. **Respeta la UI Actual:** Antes de rediseñar un componente, revisa si ya existe un estándar en `src/components/ui/`.
5. **Cero dependencias pesadas no autorizadas:** No instales paquetes grandes (ej. lodash entero) si puedes usar funciones nativas de JS (ES6+).

## 7. Interacción con el Backend
- El backend está separado (revisar carpetas `Backend/` y `SQL/` en la raíz). 
- Todas las peticiones del frontend deben pasar por las funciones configuradas en `src/api/` para que inyecten el Token JWT automáticamente y manejen errores 401/403 de forma global.

---
*Fin del Contexto. A partir de este momento, asume que comprendes el sistema Voxman y genera código respetando este estándar.*
