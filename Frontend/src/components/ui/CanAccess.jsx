import { useAuthStore } from "../../store/authStore";

export default function CanAccess({ permission, role, children }) {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  // Si se pasa un rol, validamos si tiene ese rol
  if (role) {
    const hasRole = user.roles?.includes(role) || user.roles?.includes('Owner');
    if (hasRole) return children;
  }

  // Si se pasa un permiso, validamos si tiene ese permiso
  if (permission) {
    const hasPermission = user.permissions?.includes(permission) || user.roles?.includes('Owner');
    if (hasPermission) return children;
  }

  // Si no pasó validaciones, no renderizamos nada
  return null;
}
