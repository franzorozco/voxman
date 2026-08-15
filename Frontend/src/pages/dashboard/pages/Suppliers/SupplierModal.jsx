import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { createSupplier, updateSupplier } from "../../../../api/admin/suppliers";
import "./Suppliers.css";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function SupplierModal({ supplier, onClose }) {
  const [loading, setLoading] = useState(false);
  const [phoneCode, setPhoneCode] = useState('+591');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    contact_name: "",
    tax_id: "",
    phone: "",
    email: "",
    status: "active"
  });

  useEffect(() => {
    if (supplier) {
      if (supplier.phone) {
        const parts = supplier.phone.split(' ');
        if (parts.length > 1 && parts[0].startsWith('+')) {
          setPhoneCode(parts[0]);
          setPhoneNumber(parts.slice(1).join(' '));
        } else {
          setPhoneCode('+591');
          setPhoneNumber(supplier.phone);
        }
      } else {
        setPhoneCode('+591');
        setPhoneNumber('');
      }

      setFormData({
        name: supplier.name || "",
        company_name: supplier.company_name || "",
        contact_name: supplier.contact_name || "",
        tax_id: supplier.tax_id || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        status: supplier.status || "active"
      });
    }
  }, [supplier]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalPhone = phoneNumber ? `${phoneCode} ${phoneNumber}` : "";
      const submitData = { ...formData, phone: finalPhone };

      if (supplier) {
        const { data } = await updateSupplier(supplier.id, submitData);
        toast.success(data.message);
      } else {
        const { data } = await createSupplier(submitData);
        toast.success(data.message);
      }
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Ocurrió un error al guardar el proveedor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
      <div className="modal-content fade-in" style={{ background: 'var(--bg-main)', borderRadius: '16px', overflow: 'hidden', maxWidth: '500px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
            {supplier ? "Editar Proveedor" : "Nuevo Proveedor"}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }} type="button">
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Nombre Comercial / Alias *</label>
              <input
                type="text"
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej. Distribuidora Central"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Razón Social (Opcional)</label>
              <input
                type="text"
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Ej. Distribuidores Unidos S.A."
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>NIT / Identificación Fiscal</label>
              <input
                type="text"
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                placeholder="Ej. 123456789-0"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Nombre del Contacto</label>
              <input
                type="text"
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Teléfono</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <CustomSelect
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      style={{ width: '120px', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
                    >
                      <option value="+591">🇧🇴 +591</option>
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+51">🇵🇪 +51</option>
                      <option value="+54">🇦🇷 +54</option>
                      <option value="+56">🇨🇱 +56</option>
                      <option value="+57">🇨🇴 +57</option>
                      <option value="+58">🇻🇪 +58</option>
                      <option value="+593">🇪🇨 +593</option>
                      <option value="+595">🇵🇾 +595</option>
                      <option value="+598">🇺🇾 +598</option>
                      <option value="+507">🇵🇦 +507</option>
                      <option value="+506">🇨🇷 +506</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+1">🇺🇸 +1</option>
                    </CustomSelect>
                    <input
                      type="text"
                      style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Ej. 76619663"
                    />
                  </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Estado</label>
                <CustomSelect
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </CustomSelect>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Correo Electrónico</label>
              <input
                type="email"
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Ej. ventas@distribuidora.com"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button 
                type="button" 
                onClick={onClose} 
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontWeight: 500, cursor: 'pointer', transition: '0.2s' }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'var(--color-primary-text)', fontWeight: 600, cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                disabled={loading}
              >
                {loading ? <span className="animate-spin">⏳</span> : <Save size={18} />}
                {loading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
