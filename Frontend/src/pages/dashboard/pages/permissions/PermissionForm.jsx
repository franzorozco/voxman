import { useState, useEffect } from "react";

export default function PermissionForm({ permission, onClose, onSubmit }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (permission) {
      setName(permission.name);
    } else {
      setName("");
    }
  }, [permission]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{permission ? "Editar Permiso" : "Crear Permiso"}</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre del permiso"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="modal-actions">
            <button type="submit" className="btn-primary">
              Guardar
            </button>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}