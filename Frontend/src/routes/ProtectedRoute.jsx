import { useAuthStore } from "../store/authstore";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" />;
  }

  // si se requiere rol y no lo tiene
  if (role && !user?.roles?.includes(role)) {
    return <Navigate to="/" />;
  }

  return children;
}