export default function UsersTable({ users, onEdit, onDelete }) {
  return (
    <table className="users-table">
      <thead>
        <tr>
          <th>Email</th>
          <th>Username</th>
          <th>Nombre</th>
          <th>Rol</th>
          <th>Tipo</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        {users.map((u) => (
          <tr key={u.id}>
            <td>{u.email}</td>
            <td>{u.username}</td>

            <td>
              {u.profile?.first_name} {u.profile?.last_name_paternal}
            </td>

            <td>
              {u.roles?.map((r) => r.name).join(", ")}
            </td>

            <td>
              {u.owner && <span className="badge badge-owner">Owner</span>}
              {u.customer && <span className="badge badge-customer">Customer</span>}
            </td>

            <td>
              <button className="btn-edit" onClick={() => onEdit(u)}>
                Editar
              </button>

              <button className="btn-delete" onClick={() => onDelete(u.id)}>
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}