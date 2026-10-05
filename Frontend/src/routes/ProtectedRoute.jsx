import { useAuthStore } from "../store/authStore";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, roles = [], permissions = [] }) {
  const user = useAuthStore((state) => state.user);

  // no logueado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si es Owner, pasa siempre
  if (user?.roles?.includes('Owner')) {
    return children;
  }

  // si no hay roles ni permisos requeridos, deja pasar
  if (roles.length === 0 && permissions.length === 0) {
    return children;
  }

  // validar roles del usuario
  const userRoles = user?.roles ?? [];
  const hasRoleAccess = roles.length === 0 || userRoles.some((role) => roles.includes(role));

  // validar permisos del usuario
  const userPermissions = user?.permissions ?? [];
  const hasPermissionAccess = permissions.length === 0 || permissions.some((perm) => userPermissions.includes(perm));

  if (!hasRoleAccess || !hasPermissionAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
}