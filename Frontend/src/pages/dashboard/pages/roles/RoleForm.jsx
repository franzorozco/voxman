import { useState, useEffect } from "react";
import { getPermissions } from "../../../../api/permissions";

export default function RoleForm({ role, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    loadPermissions();

    if (role) {
      setName(role.name);

      // 🔥 cargar permisos del rol
      const ids = role.permissions?.map(p => p.name) || [];
      setSelectedPermissions(ids);
    }
  }, [role]);

  const loadPermissions = async () => {
    const res = await getPermissions();
    setPermissions(res.data);
  };

  const togglePermission = (perm) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({
      name,
      permissions: selectedPermissions // 🔥 clave
    });
  };

  return (
    <div className="modal-overlay">
      <form className="modal" onSubmit={handleSubmit}>
        <h2>{role ? "Editar" : "Crear"} Rol</h2>

        {/* 🔹 NOMBRE */}
        <div className="form-group">
          <label>Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del rol"
          />
        </div>

        {/* 🔹 PERMISOS */}
        <div className="form-group">
          <label>Permisos</label>

            <div className="permissions-grid">
              {permissions.map((p) => {
                const active = selectedPermissions.includes(p.name);

                return (
                  <div
                    key={p.id}
                    className={`permission-card ${active ? "active" : ""}`}
                    onClick={() => togglePermission(p.name)}
                  >
                    <span className="permission-name">{p.name}</span>

                    <div className={`switch ${active ? "on" : ""}`}>
                      <div className="switch-circle"></div>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>

        {/* 🔹 ACTIONS */}
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