export default function RolesTable({ roles, onEdit, onDelete }) {
  return (
    <table className="roles-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        {roles.map((r) => (
          <tr key={r.id}>
            <td>{r.id}</td>
            <td>{r.name}</td>

            <td>
                <button className="btn-edit" onClick={() => onEdit(r)}>
                Editar
                </button>

                <button className="btn-delete" onClick={() => onDelete(r.id)}>
                Eliminar
                </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}