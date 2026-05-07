import { useAuthStore } from "../store/authStore";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, roles }) {

  const user = useAuthStore((state) => state.user);

  // NO LOGEADO
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // VALIDAR ROLES
  const hasRole = user?.roles?.some((r) =>
    roles.includes(r)
  );

  if (!hasRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}