export default function UserViewModal({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">

        <h2>Información del usuario</h2>

        <div className="user-view-grid">

          {/* ================= BASICO ================= */}
          <div>
            <strong>Email:</strong>
            <p>{user.email}</p>
          </div>

          <div>
            <strong>Username:</strong>
            <p>{user.username}</p>
          </div>

          <div>
            <strong>Nombre:</strong>
            <p>
              {user.profile?.first_name}{" "}
              {user.profile?.last_name_paternal}{" "}
              {user.profile?.last_name_maternal}
            </p>
          </div>

          <div>
            <strong>Teléfono:</strong>
            <p>{user.profile?.phone || "-"}</p>
          </div>

          <div>
            <strong>Estado:</strong>
            <p>{user.is_active ? "Activo" : "Inactivo"}</p>
          </div>

          {/* ================= TIPOS ================= */}
          <div>
            <strong>Tipo:</strong>
            <p>
              {user.owner?.is_active && "Owner "}
              {user.customer?.is_active && "Customer "}
              {user.employee?.is_active && "Employee "}
              {!user.owner?.is_active &&
               !user.customer?.is_active &&
               !user.employee?.is_active && "-"}
            </p>
          </div>

          {/* ================= ROLES ================= */}
          <div>
            <strong>Roles:</strong>
            <p>{user.roles?.map(r => r.name).join(", ") || "-"}</p>
          </div>

          {/* ================= CUSTOMER ================= */}
          {user.customer?.is_active && (
            <>
              <div>
                <strong>Código Cliente:</strong>
                <p>{user.customer.customer_code}</p>
              </div>

              <div>
                <strong>Puntos:</strong>
                <p>{user.customer.points}</p>
              </div>

              <div>
                <strong>Total Compras:</strong>
                <p>{user.customer.total_purchases}</p>
              </div>
            </>
          )}

          {/* ================= EMPLOYEE ================= */}
          {user.employee?.is_active && (
            <>
              <div>
                <strong>Código Empleado:</strong>
                <p>{user.employee.employee_code}</p>
              </div>

              <div>
                <strong>Rol Laboral:</strong>
                <p>{user.employee.role}</p>
              </div>

              <div>
                <strong>Sueldo Base:</strong>
                <p>${user.employee.base_salary}</p>
              </div>

              <div>
                <strong>Comisión:</strong>
                <p>{user.employee.commission_percentage}%</p>
              </div>
            </>
          )}

          {/* ================= FECHA ================= */}
          <div>
            <strong>Creado:</strong>
            <p>{new Date(user.created_at).toLocaleString()}</p>
          </div>

        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}