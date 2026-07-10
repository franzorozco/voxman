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
      <div className="roles-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="roles-title" style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={28} style={{ color: 'var(--color-primary)' }} />
            Administrador de Roles
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 36px', fontSize: '14px' }}>
            Gestiona los niveles de acceso y los permisos de los usuarios del sistema.
          </p>
        </div>

        <button className="btn-primary" onClick={handleCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'var(--color-primary)', color: 'var(--color-primary-text)', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.3s' }}>
          <Plus size={20} />
          Nuevo Rol
        </button>
      </div>

      <div className="roles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {roles.map((r, index) => (
          <div key={r.id} className="role-card" style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px', animation: `fadeInUp ${0.3 + index * 0.1}s ease`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                  {r.name}
                </h3>
                <div style={{ marginTop: '8px' }}>
                  {r.is_employee ? (
                    <span style={{ background: 'var(--color-primary)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Empleados</span>
                  ) : r.is_customer ? (
                    <span style={{ background: '#10b981', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Clientes</span>
                  ) : (
                    <span style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Uso General</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 10 }}>
                <button onClick={() => { setSelected(r); setOpen(true); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', transition: '0.2s' }} title="Editar Rol" onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                  <Edit size={18} />
                </button>
                <button onClick={() => setConfirmId(r.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', transition: '0.2s' }} title="Eliminar Rol" onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ flex: 1, background: 'var(--bg-input)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                  <Users size={18} />
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', lineHeight: '1' }}>{r.users_count || 0}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Usuarios</span>
                </div>
              </div>

              <div style={{ flex: 1, background: 'var(--bg-input)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                  <KeyRound size={18} />
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', lineHeight: '1' }}>{r.permissions?.length || 0}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Permisos</span>
                </div>
              </div>
            </div>
            
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '40px', height: '40px', background: r.is_employee ? 'var(--color-primary)' : r.is_customer ? '#10b981' : 'var(--border-color)', opacity: 0.1, borderRadius: '50%', transform: 'scale(5)', pointerEvents: 'none' }} />
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
        <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, padding: '20px' }}>
          <div className="modal-confirm" style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'scaleIn 0.3s ease' }}>
            <div style={{ background: '#fef2f2', color: '#ef4444', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px' }}>
              <Trash2 size={32} />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: 'var(--text-main)' }}>¿Eliminar rol?</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.5' }}>
              Estás a punto de eliminar el rol <b>{roleToDelete?.name}</b>. Esta acción removerá el nivel de acceso a todos los usuarios que lo posean.
            </p>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setConfirmId(null)}
              >
                Cancelar
              </button>
              <button 
                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#ef4444', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }} 
                onClick={confirmDelete}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}