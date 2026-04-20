export default function UserViewModal({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">

        <h2>Información del usuario</h2>

        <div className="user-view-grid">

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

          <div>
            <strong>Tipo:</strong>
            <p>
              {user.owner && "Owner"}
              {user.customer && "Customer"}
              {!user.owner && !user.customer && "-"}
            </p>
          </div>

          <div>
            <strong>Roles:</strong>
            <p>{user.roles?.map(r => r.name).join(", ") || "-"}</p>
          </div>

          <div>
            <strong>Cliente:</strong>
            <p>
              {user.customer
                ? `${user.customer.customer_code} (${user.customer.points} pts)`
                : "-"}
            </p>
          </div>

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