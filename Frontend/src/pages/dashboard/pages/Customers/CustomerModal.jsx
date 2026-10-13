import { useState, useEffect } from "react";
import { X, User, Hash, Phone, Mail, Globe, AlertCircle, CheckCircle, Shield, KeyRound, Info } from "lucide-react";
import { toast } from "react-hot-toast";
import { createCustomer, updateCustomer } from "../../../../api/admin/customers";
import Spinner from "../../components/Spinner/Spinner";

export default function CustomerModal({ customer, onClose, onSuccess }) {
  const isEditing = !!customer;
  const isAlreadyWebCustomer = isEditing && !!customer?.user && !customer?.user?.email?.includes('@guest');
  const [loading, setLoading] = useState(false);
  const [createWebAccount, setCreateWebAccount] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_code: "",
    first_name: "",
    last_name_paternal: "",
    last_name_maternal: "",
    email: "",
    phone: "",
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
        is_active: customer.is_active !== undefined ? customer.is_active : true
      });

      setCreateWebAccount(isWebCustomer && !userEmail.includes('@guest'));
    }
  }, [customer, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = { ...formData };
      if (!createWebAccount) {
        payload.email = "";
      }

      if (isEditing) {
        await updateCustomer(customer.id, payload);
        toast.success(
          createWebAccount && !isAlreadyWebCustomer
            ? "Cliente actualizado y credenciales enviadas al correo"
            : "Cliente actualizado exitosamente"
        );
      } else {
        await createCustomer(payload);
        toast.success(
          createWebAccount
            ? "Cliente creado y credenciales enviadas al correo"
            : "Cliente creado exitosamente"
        );
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al procesar el cliente");
    } finally {
      setLoading(false);
    }
  };

  const phoneCode = (formData.phone || '').includes(' ') 
    ? (formData.phone || '').split(' ')[0] 
    : '+591';
  const phoneNumber = (formData.phone || '').includes(' ') 
    ? (formData.phone || '').split(' ').slice(1).join(' ') 
    : (formData.phone || '');

  return (
    <div className="cm-overlay" onClick={onClose}>
      <div className="cm-container fade-in" onClick={(e) => e.stopPropagation()}>
        
        {/* ── HEADER ── */}
        <div className="cm-header">
          <div className="cm-header-icon-wrap">
            {isEditing ? <User size={18} /> : <User size={18} />}
          </div>
          <div className="cm-header-text">
            <h2 className="cm-title">{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <p className="cm-subtitle">
              {isEditing 
                ? 'Modifica la información del cliente' 
                : 'Completa los datos para registrar un nuevo cliente'}
            </p>
          </div>
          <button className="cm-close-btn" onClick={onClose} title="Cerrar" type="button">
            <X size={18} />
          </button>
        </div>

        {/* ── FORM ── */}
        <form onSubmit={handleSubmit} className="cm-form">
          <div className="cm-body">

            {/* ─ SECCIÓN: Identificación ─ */}
            <div className="cm-section">
              <div className="cm-section-label">
                <Hash size={13} />
                <span>Identificación</span>
              </div>

              <div className="cm-field">
                <label className="cm-label" htmlFor="cm-code">
                  Código de Cliente <span className="cm-required">*</span>
                </label>
                <div className="cm-input-wrapper">
                  <Hash size={15} className="cm-input-icon" />
                  <input
                    id="cm-code"
                    type="text"
                    className="cm-input cm-input--icon"
                    value={formData.customer_code}
                    onChange={(e) => setFormData({...formData, customer_code: e.target.value.toUpperCase()})}
                    placeholder="Ej. CUST-001"
                    required
                    autoComplete="off"
                  />
                </div>
                <span className="cm-hint">Se generará un código único si se deja vacío.</span>
              </div>
            </div>

            {/* ─ SECCIÓN: Datos Personales ─ */}
            <div className="cm-section">
              <div className="cm-section-label">
                <User size={13} />
                <span>Datos Personales</span>
              </div>

              <div className="cm-field">
                <label className="cm-label" htmlFor="cm-fname">
                  Nombres <span className="cm-required">*</span>
                </label>
                <div className="cm-input-wrapper">
                  <User size={15} className="cm-input-icon" />
                  <input
                    id="cm-fname"
                    type="text"
                    className="cm-input cm-input--icon"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    placeholder="Ingresa nombres"
                    required
                    autoComplete="given-name"
                  />
                </div>
              </div>

              <div className="cm-grid-2">
                <div className="cm-field">
                  <label className="cm-label" htmlFor="cm-lname-p">Apellido Paterno</label>
                  <input
                    id="cm-lname-p"
                    type="text"
                    className="cm-input"
                    value={formData.last_name_paternal}
                    onChange={(e) => setFormData({...formData, last_name_paternal: e.target.value})}
                    placeholder="Apellido paterno"
                    autoComplete="family-name"
                  />
                </div>
                <div className="cm-field">
                  <label className="cm-label" htmlFor="cm-lname-m">Apellido Materno</label>
                  <input
                    id="cm-lname-m"
                    type="text"
                    className="cm-input"
                    value={formData.last_name_maternal}
                    onChange={(e) => setFormData({...formData, last_name_maternal: e.target.value})}
                    placeholder="Apellido materno"
                    autoComplete="additional-name"
                  />
                </div>
              </div>

              <div className="cm-field">
                <label className="cm-label" htmlFor="cm-phone-num">Teléfono</label>
                <div className="cm-phone-row">
                  <div className="cm-phone-code-wrapper">
                    <Phone size={13} className="cm-phone-icon" />
                    <input
                      type="text"
                      className="cm-input cm-phone-code"
                      value={phoneCode}
                      onChange={(e) => setFormData({...formData, phone: `${e.target.value} ${phoneNumber}`.trim()})}
                      placeholder="+591"
                      maxLength={5}
                    />
                  </div>
                  <input
                    id="cm-phone-num"
                    type="tel"
                    className="cm-input cm-phone-number"
                    value={phoneNumber}
                    onChange={(e) => setFormData({...formData, phone: `${phoneCode} ${e.target.value}`.trim()})}
                    placeholder="Número de teléfono"
                    autoComplete="tel-national"
                  />
                </div>
              </div>
            </div>

            {/* ─ SECCIÓN: Cuenta Web ─ */}
            <div className="cm-section">
              <div className="cm-section-label">
                <Globe size={13} />
                <span>Cuenta Web</span>
              </div>

              {/* Toggle Switch para cuenta web */}
              <div className="cm-toggle-card" onClick={() => setCreateWebAccount(v => !v)}>
                <div className="cm-toggle-info">
                  <div className="cm-toggle-icon-wrap">
                    <Globe size={16} />
                  </div>
                  <div>
                    <div className="cm-toggle-title">Habilitar cuenta web</div>
                    <div className="cm-toggle-desc">Permite al cliente iniciar sesión con correo y contraseña</div>
                  </div>
                </div>
                <div className={`cm-toggle-switch ${createWebAccount ? 'active' : ''}`}>
                  <div className="cm-toggle-knob" />
                </div>
              </div>

              {createWebAccount && (
                <div className="cm-web-fields fade-in">
                  <div className="cm-field">
                    <label className="cm-label" htmlFor="cm-email">
                      Correo Electrónico <span className="cm-required">*</span>
                    </label>
                    <div className="cm-input-wrapper">
                      <Mail size={15} className="cm-input-icon" />
                      <input
                        id="cm-email"
                        type="email"
                        className="cm-input cm-input--icon"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="correo@ejemplo.com"
                        required={createWebAccount}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Información sobre la contraseña temporal y correo */}
                  {!isAlreadyWebCustomer ? (
                    <div className="cm-info-box">
                      <div className="cm-info-icon-wrap">
                        <KeyRound size={16} />
                      </div>
                      <div className="cm-info-content">
                        <div className="cm-info-title">Contraseña automática y bienvenida</div>
                        <div className="cm-info-desc">
                          El sistema generará una contraseña temporal segura y le enviará un correo de bienvenida automático desde <strong>soporte@voxman.shop</strong> con sus credenciales de acceso.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="cm-info-box info-blue">
                      <div className="cm-info-icon-wrap">
                        <Info size={16} />
                      </div>
                      <div className="cm-info-content">
                        <div className="cm-info-title">Cuenta web activa</div>
                        <div className="cm-info-desc">
                          Este cliente ya cuenta con acceso web con este correo. Si necesita una nueva contraseña, puede utilizar la opción de recuperación desde la tienda.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─ SECCIÓN: Estado ─ */}
            <div className="cm-section">
              <div className="cm-section-label">
                <Shield size={13} />
                <span>Estado del Cliente</span>
              </div>

              <div 
                className={`cm-status-toggle ${formData.is_active ? 'status-active' : 'status-inactive'}`}
                onClick={() => setFormData({...formData, is_active: !formData.is_active})}
              >
                <div className="cm-status-left">
                  {formData.is_active 
                    ? <CheckCircle size={18} className="cm-status-icon" />
                    : <AlertCircle size={18} className="cm-status-icon" />
                  }
                  <div>
                    <div className="cm-status-title">
                      {formData.is_active ? 'Cliente Activo' : 'Cliente Inactivo'}
                    </div>
                    <div className="cm-status-desc">
                      {formData.is_active 
                        ? 'Puede iniciar sesión y realizar compras'
                        : 'El cliente está suspendido temporalmente'}
                    </div>
                  </div>
                </div>
                <div className={`cm-toggle-switch ${formData.is_active ? 'active' : ''}`}>
                  <div className="cm-toggle-knob" />
                </div>
              </div>
            </div>

          </div>

          {/* ── FOOTER ── */}
          <div className="cm-footer">
            <button 
              type="button" 
              className="cm-btn-cancel" 
              onClick={onClose} 
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="cm-btn-submit" 
              disabled={loading}
            >
              {loading 
                ? <Spinner size={18} color="#ffffff" trackColor="rgba(255,255,255,0.3)" borderWidth={2} />
                : (isEditing ? 'Guardar Cambios' : 'Crear Cliente')
              }
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
