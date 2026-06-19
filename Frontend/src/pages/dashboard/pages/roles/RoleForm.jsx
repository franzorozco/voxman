import { useState, useEffect } from "react";
import { getPermissions } from "../../../../api/admin/permissions";

export default function RoleForm({ role, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [roleType, setRoleType] = useState("none");
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    loadPermissions();

    if (role) {
      setName(role.name);
      
      if (role.is_employee) setRoleType('employee');
      else if (role.is_customer) setRoleType('customer');
      else setRoleType('none');

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
      permissions: selectedPermissions, // 🔥 clave
      is_employee: roleType === 'employee',
      is_customer: roleType === 'customer'
    });
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
            required
          />
        </div>

        {/* 🔹 TIPO DE ROL */}
        <div className="form-group">
          <label>Asignable a</label>
          <select 
            value={roleType} 
            onChange={(e) => setRoleType(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
          >
            <option value="none">Sin asignación específica</option>
            <option value="employee">Empleados</option>
            <option value="customer">Clientes</option>
          </select>
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