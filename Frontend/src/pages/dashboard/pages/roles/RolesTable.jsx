import { useState } from "react";

export default function RolesTable({ roles, onEdit, onDelete }) {
  const [confirmId, setConfirmId] = useState(null);

  const handleDelete = (id) => {
    setConfirmId(id);
  };

  const confirmDelete = () => {
    onDelete(confirmId);
    setConfirmId(null);
  };

  const roleToDelete = roles.find((r) => r.id === confirmId);

  return (
    <>
      <table className="roles-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Asignable a</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {roles.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.name}</td>
              <td>
                {r.is_employee ? (
                  <span style={{ background: 'var(--color-primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Empleados</span>
                ) : r.is_customer ? (
                  <span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Clientes</span>
                ) : (
                  <span style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>General</span>
                )}
              </td>

              <td>
                <button className="btn-edit" onClick={() => onEdit(r)}>
                  Editar
                </button>

                <button
                  className="btn-delete"
                  onClick={() => handleDelete(r.id)}
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
            <h3>¿Eliminar rol?</h3>

            <p>
              Vas a eliminar:{" "}
              <b>{roleToDelete?.name}</b>
            </p>

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