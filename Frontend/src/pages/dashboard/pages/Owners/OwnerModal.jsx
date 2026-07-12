import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import { createOwner, updateOwner } from "../../../../api/admin/owners";
import { useAuthStore } from "../../../../store/authStore";

export default function OwnerModal({ owner, onClose, onSuccess }) {
  const user = useAuthStore((state) => state.user);
  const canManageCredentials = user?.permissions?.includes('manage_owners_credentials') || user?.roles?.includes('Owner');
  
  const isEditing = !!owner;
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name_paternal: "",
    last_name_maternal: "",
    email: "",
    phone: "",
    password: "",
    is_active: true
  });

  useEffect(() => {
    if (isEditing) {
      const profile = owner.user?.profile || {};
      const userEmail = owner.user?.email || "";
      
      setFormData({
        first_name: profile.first_name || "",
        last_name_paternal: profile.last_name_paternal || "",
        last_name_maternal: profile.last_name_maternal || "",
        email: userEmail,
        phone: profile.phone || "",
        password: "", // Leave blank on edit unless changing
        is_active: owner.is_active
      });
    }
  }, [owner, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.email) {
      toast.error("Nombre y correo son obligatorios");
      return;
    }
    if (!isEditing && !formData.password) {
      toast.error("La contraseña es obligatoria para un nuevo socio");
      return;
    }

    try {
      setLoading(true);
      
      if (isEditing) {
        await updateOwner(owner.id, formData);
        toast.success("Socio actualizado exitosamente");
      } else {
        await createOwner(formData);
        toast.success("Socio creado exitosamente");
      }
      onSuccess();
    } catch (error) {
      const msg = error.response?.data?.message || "Error al guardar el socio";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
      <div className="modal-content fade-in" style={{ background: 'var(--bg-main)', borderRadius: '16px', overflow: 'hidden', maxWidth: '600px', width: '100%', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
            {isEditing ? 'Editar Socio' : 'Nuevo Socio'}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          <form id="ownerForm" onSubmit={handleSubmit}>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div className="modal-form-grid">
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Nombres *</label>
                  <input 
                    type="text" 
                    name="first_name"
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' }}
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Ej. Juan"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Apellido Paterno</label>
                  <input 
                    type="text" 
                    name="last_name_paternal"
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' }}
                    value={formData.last_name_paternal}
                    onChange={handleChange}
                    placeholder="Ej. Pérez"
                  />
                </div>
              </div>

              <div className="modal-form-grid">
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Apellido Materno</label>
                  <input 
                    type="text" 
                    name="last_name_maternal"
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' }}
                    value={formData.last_name_maternal}
                    onChange={handleChange}
                    placeholder="Ej. López"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Teléfono</label>
                  <input 
                    type="text" 
                    name="phone"
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' }}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Ej. 77766655"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Correo Electrónico * {!canManageCredentials && '(Solo lectura)'}
                </label>
                <input 
                  type="email" 
                  name="email"
                  style={{ 
                    width: '100%', 
                    padding: '10px 14px', 
                    background: canManageCredentials ? 'var(--bg-input)' : 'var(--bg-overlay)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    color: canManageCredentials ? 'var(--text-main)' : 'var(--text-muted)', 
                    fontSize: '14px',
                    cursor: canManageCredentials ? 'text' : 'not-allowed'
                  }}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ejemplo@voxman.com"
                  required
                  disabled={!canManageCredentials}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Contraseña {isEditing ? '(Dejar en blanco para no cambiar)' : '*'} {!canManageCredentials && '(Solo lectura)'}
                </label>
                <input 
                  type="password" 
                  name="password"
                  style={{ 
                    width: '100%', 
                    padding: '10px 14px', 
                    background: canManageCredentials ? 'var(--bg-input)' : 'var(--bg-overlay)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    color: canManageCredentials ? 'var(--text-main)' : 'var(--text-muted)', 
                    fontSize: '14px',
                    cursor: canManageCredentials ? 'text' : 'not-allowed'
                  }}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isEditing ? "Nueva contraseña..." : "Contraseña secreta"}
                  required={!isEditing}
                  disabled={!canManageCredentials}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
                <input 
                  type="checkbox" 
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>Socio Activo (Permite acceso al sistema)</span>
              </label>

            </div>
          </form>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-card)' }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontWeight: 500, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="ownerForm"
            disabled={loading}
            style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'var(--color-primary-text)', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Guardando...' : 'Guardar Socio'}
          </button>
        </div>

      </div>
    </div>
  );
}
