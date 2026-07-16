import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import { createCustomer, updateCustomer } from "../../../../api/admin/customers";
import Spinner from "../../components/Spinner/Spinner";

export default function CustomerModal({ customer, onClose, onSuccess }) {
  const isEditing = !!customer;
  const [loading, setLoading] = useState(false);
  const [createWebAccount, setCreateWebAccount] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_code: "",
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
      const isWebCustomer = !!customer.user;
      const profile = isWebCustomer 
        ? (customer.user?.profile || {}) 
        : (customer.pos_profile || customer.posProfile || {});
        
      const userEmail = customer.user?.email || "";
      
      setFormData({
        customer_code: customer.customer_code || "",
        first_name: profile.first_name || "",
        last_name_paternal: profile.last_name_paternal || "",
        last_name_maternal: profile.last_name_maternal || "",
        email: userEmail.includes('@guest') ? "" : userEmail,
        phone: profile.phone || "",
        password: "", // Keep empty on edit unless changing
        is_active: customer.is_active !== undefined ? customer.is_active : true
      });

      setCreateWebAccount(isWebCustomer && !userEmail.includes('@guest'));
    }
  }, [customer, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Si la cuenta web no está habilitada, limpiamos los campos de email y password
      // para que el backend no los procese y genere los ficticios automáticamente.
      const payload = { ...formData };
      if (!createWebAccount) {
        payload.email = "";
        payload.password = "";
      }

      if (isEditing) {
        await updateCustomer(customer.id, payload);
        toast.success("Cliente actualizado exitosamente");
      } else {
        await createCustomer(payload);
        toast.success("Cliente creado exitosamente");
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al procesar el cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
      <div className="modal-content fade-in" style={{ background: 'var(--bg-main)', borderRadius: '16px', overflow: 'hidden', maxWidth: '500px', width: '100%', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Código de Cliente (Manual) *</label>
              <input 
                type="text" 
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' }}
                value={formData.customer_code}
                onChange={(e) => setFormData({...formData, customer_code: e.target.value.toUpperCase()})}
                placeholder="Ej. CUST-001"
                required
              />
            </div>
            
            <div className="modal-form-grid">
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Nombres *</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' }}
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Apellido Paterno</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' }}
                  value={formData.last_name_paternal}
                  onChange={(e) => setFormData({...formData, last_name_paternal: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Apellido Materno</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' }}
                  value={formData.last_name_maternal}
                  onChange={(e) => setFormData({...formData, last_name_maternal: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Teléfono</label>
              <input 
                type="text" 
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' }}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: createWebAccount ? '16px' : '0' }}>
                <input 
                  type="checkbox" 
                  id="create_web_account"
                  checked={createWebAccount}
                  onChange={(e) => setCreateWebAccount(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                />
                <label htmlFor="create_web_account" style={{ fontSize: '14px', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>
                  Habilitar cuenta web (Correo y Contraseña)
                </label>
              </div>

              {createWebAccount && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Correo Electrónico *
                    </label>
                    <input 
                      type="email" 
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' }}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required={createWebAccount}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Contraseña {isEditing ? '(Opcional, dejar vacío para no cambiar)' : '*'}
                    </label>
                    <input 
                      type="password" 
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' }}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder={isEditing ? "********" : "Ingresar contraseña"}
                      required={createWebAccount && !isEditing}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
              <input 
                type="checkbox" 
                id="is_active_checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
              />
              <label htmlFor="is_active_checkbox" style={{ fontSize: '14px', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }}>
                Cliente Activo (Permite iniciar sesión y comprar)
              </label>
            </div>

          </div>
          
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-card)' }}>
            <button type="button" className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 20px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '160px' }} disabled={loading}>
              {loading ? <Spinner size={20} color="#ffffff" trackColor="rgba(255,255,255,0.3)" borderWidth={2} /> : "Guardar Cliente"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
