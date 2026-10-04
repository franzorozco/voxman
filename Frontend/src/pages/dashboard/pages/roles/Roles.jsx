import { useEffect, useState } from "react";
import { getRoles, createRole, updateRole, deleteRole } from "../../../../api/admin/roles";
import { Shield, Users, KeyRound, Edit, Trash2, Plus } from "lucide-react";

import "./Roles.css";
import "../css/stylesCruds.css";
import RoleForm from "./RoleForm";
import toast from "react-hot-toast";

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const loadRoles = async () => {
    try {
      const res = await getRoles();
      setRoles(res.data);
    } catch (error) {
      toast.error("Error al cargar roles");
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleCreate = () => {
    setSelected(null);
    setOpen(true);
  };

  const handleSubmit = async (data) => {
    try {
      if (selected) {
        await updateRole(selected.id, data);
        toast.success("Rol actualizado con éxito");
      } else {
        await createRole(data);
        toast.success("Rol creado con éxito");
      }
      setOpen(false);
      loadRoles();
    } catch (error) {
      toast.error("Error al guardar el rol");
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteRole(confirmId);
      toast.success("Rol eliminado");
      setConfirmId(null);
      loadRoles();
    } catch (error) {
      toast.error("Error al eliminar el rol");
    }
  };

  const roleToDelete = roles.find((r) => r.id === confirmId);

  return (
    <div className="roles-container">
      <div className="roles-header-container">
        <div className="roles-header-title-row">
          <div className="roles-header-icon-box">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="roles-header-title">Administrador de Roles</h1>
            <p className="roles-header-subtitle">Gestiona los niveles de acceso y los permisos de los usuarios del sistema.</p>
          </div>
        </div>

        <div className="roles-header-actions">
          <button className="btn-primary" onClick={handleCreate}>
            <Plus size={20} />
            <span>Nuevo Rol</span>
          </button>
        </div>
      </div>

      <div className="roles-grid">
        {roles.map((r, index) => (
          <div key={r.id} className="role-card" style={{ animation: `fadeInUp ${0.3 + index * 0.1}s ease` }}>
            <div className="role-card-header">
              <div>
                <h3 className="role-card-title">
                  {r.name}
                </h3>
                <div className="role-card-badge-container">
                  {r.is_employee ? (
                    <span className="role-badge role-badge-employee">Empleados</span>
                  ) : r.is_customer ? (
                    <span className="role-badge role-badge-customer">Clientes</span>
                  ) : (
                    <span className="role-badge role-badge-general">Uso General</span>
                  )}
                </div>
              </div>
              <div className="role-card-actions">
                <button onClick={() => { setSelected(r); setOpen(true); }} className="role-action-btn edit" title="Editar Rol">
                  <Edit size={18} />
                </button>
                <button onClick={() => setConfirmId(r.id)} className="role-action-btn delete" title="Eliminar Rol">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="role-card-stats">
              <div className="role-stat-box">
                <div className="role-stat-icon users">
                  <Users size={18} />
                </div>
                <div>
                  <span className="role-stat-number">{r.users_count || 0}</span>
                  <span className="role-stat-label">Usuarios</span>
                </div>
              </div>

              <div className="role-stat-box">
                <div className="role-stat-icon perms">
                  <KeyRound size={18} />
                </div>
                <div>
                  <span className="role-stat-number">{r.permissions?.length || 0}</span>
                  <span className="role-stat-label">Permisos</span>
                </div>
              </div>
            </div>
            
            <div className={`role-card-bg-blob ${r.is_employee ? "employee" : r.is_customer ? "customer" : "general"}`} />
          </div>
        ))}
      </div>

      {open && (
        <RoleForm
          role={selected}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      {confirmId && (
        <div className="modal-overlay modal-confirm-overlay">
          <div className="modal-confirm">
            <div className="modal-confirm-icon-box">
              <Trash2 size={32} />
            </div>
            <h2 className="modal-confirm-title">¿Eliminar rol?</h2>
            <p className="modal-confirm-text">
              Estás a punto de eliminar el rol <b>{roleToDelete?.name}</b>. Esta acción removerá el nivel de acceso a todos los usuarios que lo posean.
            </p>

            <div className="modal-confirm-actions">
              <button
                className="modal-confirm-btn cancel"
                onClick={() => setConfirmId(null)}
              >
                Cancelar
              </button>
              <button
                className="modal-confirm-btn confirm"
                onClick={confirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}