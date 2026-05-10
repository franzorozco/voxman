import { useAuthStore } from "../store/authStore";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, roles = [] }) {
  const user = useAuthStore((state) => state.user);

  // no logueado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // si no hay roles requeridos, deja pasar
  if (roles.length === 0) {
    return children;
  }

  // validar roles del usuario
  const userRoles = user?.roles ?? [];

  const hasAccess = userRoles.some((role) =>
    roles.includes(role)
  );

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
}