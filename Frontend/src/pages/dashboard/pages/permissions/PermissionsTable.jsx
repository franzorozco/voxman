import { useState } from "react";

export default function PermissionsTable({ permissions, onEdit, onDelete }) {
  const [confirmId, setConfirmId] = useState(null);

  const handleDelete = (id) => {
    setConfirmId(id);
  };

  const confirmDelete = () => {
    onDelete(confirmId);
    setConfirmId(null);
  };

  return (
    <>
      <table className="permissions-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {permissions.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>
                <button className="btn-edit" onClick={() => onEdit(p)}>
                  Editar
                </button>

                <button
                  className="btn-delete"
                  onClick={() => handleDelete(p.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 🔥 MODAL */}
      {confirmId && (
        <div className="modal-overlay">
          <div className="modal-confirm">
            <h3>¿Estás seguro?</h3>
            <p>Esta acción eliminará el permiso.</p>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setConfirmId(null)}
              >
                Cancelar
              </button>

              <button className="btn-danger" onClick={confirmDelete}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}