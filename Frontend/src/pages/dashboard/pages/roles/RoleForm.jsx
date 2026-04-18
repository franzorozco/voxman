import { useState, useEffect } from "react";

export default function RoleForm({ role, onClose, onSubmit }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (role) {
      setName(role.name);
    }
  }, [role]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name });
  };

  return (
    <div className="modal-overlay">
      <form className="modal" onSubmit={handleSubmit}>
        <h2>{role ? "Editar" : "Crear"} Rol</h2>

            <div className="form-group">
            <label>Nombre</label>
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del rol"
            />
            </div>

            <div className="form-actions">
            <button type="submit" className="btn-primary">
                Guardar
            </button>

            <button type="button" onClick={onClose}>
                Cancelar
            </button>
            </div>
      </form>
    </div>
  );
}