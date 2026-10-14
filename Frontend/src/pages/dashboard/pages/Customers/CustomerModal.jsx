import { useState, useEffect } from "react";
import { X, User, Hash, Phone, Mail, Globe, AlertCircle, AlertTriangle, CheckCircle, Shield, KeyRound, Info, AtSign, Store } from "lucide-react";
import { toast } from "react-hot-toast";
import { createCustomer, updateCustomer, checkCustomerEmail } from "../../../../api/admin/customers";
import Spinner from "../../components/Spinner/Spinner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_HAS_NUMBERS_REGEX = /\d/;

export default function CustomerModal({ customer, onClose, onSuccess }) {
  const isEditing = !!customer;
  const isAlreadyWebCustomer = isEditing && !!customer?.user && !customer?.user?.email?.includes('@guest');
  const [loading, setLoading] = useState(false);
  const [createWebAccount, setCreateWebAccount] = useState(false);

  const [phoneCode, setPhoneCode] = useState("+591");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [formData, setFormData] = useState({
    customer_code: "",
    first_name: "",
    last_name_paternal: "",
    last_name_maternal: "",
    email: "",
    is_active: true
  });

  const [fieldWarnings, setFieldWarnings] = useState({});
  const [emailCheck, setEmailCheck] = useState({
    checking: false,
    status: null, // 'available' | 'own_email' | 'active_exists' | 'deleted_under_60' | 'deleted_over_60' | 'invalid_format'
    message: "",
    days_deleted: null,
    days_remaining: null,
    username_preview: ""
  });

  useEffect(() => {
    if (isEditing) {
      const isWebCustomer = !!customer.user;
      const profile = isWebCustomer 
        ? (customer.user?.profile || {}) 
        : (customer.pos_profile || customer.posProfile || {});
        
      const userEmail = customer.user?.email || "";
      const rawPhone = (profile.phone || "").trim();

      let parsedCode = "+591";
      let parsedNum = "";
      if (rawPhone) {
        const match = rawPhone.match(/^(\+\d{1,4})\s+(.*)$/);
        if (match) {
          parsedCode = match[1];
          parsedNum = match[2];
        } else if (/^\+\d{1,4}$/.test(rawPhone)) {
          parsedCode = rawPhone;
          parsedNum = "";
        } else {
          parsedNum = rawPhone;
        }
      }

      setPhoneCode(parsedCode);
      setPhoneNumber(parsedNum);
      
      setFormData({
        customer_code: customer.customer_code || "",
        first_name: profile.first_name || "",
        last_name_paternal: profile.last_name_paternal || "",
        last_name_maternal: profile.last_name_maternal || "",
        email: userEmail.includes('@guest') ? "" : userEmail,
        is_active: customer.is_active !== undefined ? customer.is_active : true
      });

      setCreateWebAccount(isWebCustomer && !userEmail.includes('@guest'));
    } else {
      // Autogenerar un código sugerido al abrir para Nuevo Cliente
      const randomCode = String(Math.floor(1000000000 + Math.random() * 9000000000));
      setFormData(prev => ({ ...prev, customer_code: randomCode }));
    }
  }, [customer, isEditing]);

  // Extraer username sin @gmail.com / @hotmail.com ni ningún dominio
  const rawEmailTrimmed = (formData.email || "").trim().toLowerCase();
  const extractedUsername = rawEmailTrimmed.includes("@")
    ? rawEmailTrimmed.split("@")[0].trim()
    : rawEmailTrimmed;

  // Validación en tiempo real de datos personales
  useEffect(() => {
    const warnings = {};
    const fname = formData.first_name.trim();
    const lnameP = formData.last_name_paternal.trim();
    const lnameM = formData.last_name_maternal.trim();
    const pNum = phoneNumber.trim();

    if (fname && fname.length < 2) {
      warnings.first_name = "El nombre debe tener al menos 2 caracteres.";
    } else if (fname && NAME_HAS_NUMBERS_REGEX.test(fname)) {
      warnings.first_name = "Advertencia: El nombre no debe contener números.";
    }

    if (lnameP && NAME_HAS_NUMBERS_REGEX.test(lnameP)) {
      warnings.last_name_paternal = "Advertencia: El apellido paterno no debe contener números.";
    }

    if (lnameM && NAME_HAS_NUMBERS_REGEX.test(lnameM)) {
      warnings.last_name_maternal = "Advertencia: El apellido materno no debe contener números.";
    }

    if (pNum) {
      const digitsOnly = pNum.replace(/\D/g, "");
      if (/[^0-9\s\-()]/.test(pNum)) {
        warnings.phone = "El teléfono solo debe contener números.";
      } else if (digitsOnly.length < 6) {
        warnings.phone = "Advertencia: El número de teléfono parece incompleto (mínimo 6 dígitos).";
      }
    }

    setFieldWarnings(warnings);
  }, [formData.first_name, formData.last_name_paternal, formData.last_name_maternal, phoneNumber]);

  // Validación en tiempo real del correo cuando "Habilitar cuenta web" está activo
  useEffect(() => {
    if (!createWebAccount) {
      setEmailCheck({
        checking: false,
        status: null,
        message: "",
        days_deleted: null,
        days_remaining: null,
        username_preview: ""
      });
      return;
    }

    const email = (formData.email || "").trim().toLowerCase();
    if (!email) {
      setEmailCheck({
        checking: false,
        status: null,
        message: "",
        days_deleted: null,
        days_remaining: null,
        username_preview: ""
      });
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setEmailCheck({
        checking: false,
        status: "invalid_format",
        message: "Ingresa un correo electrónico válido (ejemplo: cliente@gmail.com).",
        days_deleted: null,
        days_remaining: null,
        username_preview: email.includes("@") ? email.split("@")[0] : email
      });
      return;
    }

    let isCancelled = false;
    setEmailCheck(prev => ({ ...prev, checking: true }));

    const timer = setTimeout(async () => {
      try {
        const res = await checkCustomerEmail(email, customer?.id);
        if (!isCancelled) {
          setEmailCheck({
            checking: false,
            status: res.data.status,
            message: res.data.message,
            days_deleted: res.data.days_deleted ?? null,
            days_remaining: res.data.days_remaining ?? null,
            username_preview: res.data.username_preview || email.split("@")[0]
          });
        }
      } catch (err) {
        if (!isCancelled) {
          setEmailCheck({
            checking: false,
            status: null,
            message: "",
            days_deleted: null,
            days_remaining: null,
            username_preview: email.split("@")[0]
          });
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [formData.email, createWebAccount, customer?.id]);

  const validateBeforeSubmit = async () => {
    const fname = formData.first_name.trim();
    const lnameP = formData.last_name_paternal.trim();
    const lnameM = formData.last_name_maternal.trim();
    const pNum = phoneNumber.trim();

    if (!fname || fname.length < 2) {
      toast.error("Advertencia: Debes ingresar los Nombres del cliente (mínimo 2 caracteres).");
      return false;
    }

    if (NAME_HAS_NUMBERS_REGEX.test(fname) || NAME_HAS_NUMBERS_REGEX.test(lnameP) || NAME_HAS_NUMBERS_REGEX.test(lnameM)) {
      toast.error("Advertencia: Los nombres y apellidos no deben contener números.");
      return false;
    }

    if (pNum) {
      const digitsOnly = pNum.replace(/\D/g, "");
      if (/[^0-9\s\-()]/.test(pNum) || digitsOnly.length < 6) {
        toast.error("Advertencia: Ingresa un número de teléfono válido (mínimo 6 dígitos).");
        return false;
      }
    }

    if (createWebAccount) {
      const email = (formData.email || "").trim().toLowerCase();
      if (!email) {
        toast.error("Advertencia: El correo electrónico es obligatorio cuando 'Habilitar cuenta web' está activo.");
        return false;
      }

      if (!EMAIL_REGEX.test(email)) {
        toast.error("Advertencia: El formato del correo electrónico no es válido.");
        return false;
      }

      if (!extractedUsername) {
        toast.error("Advertencia: No se pudo obtener un nombre de usuario válido del correo.");
        return false;
      }

      // Verificar estado del correo en servidor antes de enviar
      try {
        const res = await checkCustomerEmail(email, customer?.id);
        const data = res.data;
        setEmailCheck({
          checking: false,
          status: data.status,
          message: data.message,
          days_deleted: data.days_deleted ?? null,
          days_remaining: data.days_remaining ?? null,
          username_preview: data.username_preview || extractedUsername
        });

        if (data.status === "active_exists") {
          toast.error("Advertencia: Este correo ya existe y está activo. No se puede sobrescribir una cuenta activa.");
          return false;
        }

        if (data.status === "deleted_under_60") {
          toast.error(
            `Advertencia: Este correo pertenece a una cuenta eliminada hace ${data.days_deleted} día(s). Deben pasar más de 60 días para volver a crearla (faltan ${data.days_remaining} día(s)).`
          );
          return false;
        }
      } catch (err) {
        // Si falla la petición previa, el backend igual validará en store/update
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    const isValid = await validateBeforeSubmit();
    if (!isValid) {
      setLoading(false);
      return;
    }
    
    try {
      const cleanCode = (phoneCode || "+591").trim();
      const cleanPhoneNum = phoneNumber.trim();
      const fullPhone = cleanPhoneNum ? `${cleanCode} ${cleanPhoneNum}` : "";

      const payload = {
        customer_code: (formData.customer_code || "").trim().toUpperCase(),
        first_name: formData.first_name.trim(),
        last_name_paternal: formData.last_name_paternal.trim() || null,
        last_name_maternal: formData.last_name_maternal.trim() || null,
        phone: fullPhone || null,
        email: createWebAccount ? (formData.email || "").trim().toLowerCase() : "",
        is_active: formData.is_active
      };

      if (isEditing) {
        await updateCustomer(customer.id, payload);
        toast.success(
          createWebAccount && !isAlreadyWebCustomer
            ? "Cliente web actualizado, perfil registrado y credenciales enviadas al correo"
            : "Cliente actualizado exitosamente"
        );
      } else {
        await createCustomer(payload);
        toast.success(
          createWebAccount
            ? `Cliente web creado (usuario: ${extractedUsername}) y credenciales enviadas al correo`
            : "Cliente POS (Caja) creado exitosamente"
        );
      }
      onSuccess();
    } catch (error) {
      const backendMsg =
        error.response?.data?.message ||
        (error.response?.data?.errors ? Object.values(error.response.data.errors).flat()[0] : null) ||
        "Error al procesar el cliente";
      toast.error(backendMsg);
    } finally {
      setLoading(false);
    }
  };

  const isEmailBlocked =
    createWebAccount &&
    (emailCheck.status === "active_exists" ||
      emailCheck.status === "deleted_under_60" ||
      emailCheck.status === "invalid_format");

  const hasPersonalWarnings = Boolean(
    fieldWarnings.first_name ||
    fieldWarnings.last_name_paternal ||
    fieldWarnings.last_name_maternal ||
    fieldWarnings.phone
  );

  return (
    <div className="cm-overlay" onClick={onClose}>
      <div className="cm-container fade-in" onClick={(e) => e.stopPropagation()}>
        
        {/* ── HEADER ── */}
        <div className="cm-header">
          <div className="cm-header-icon-wrap">
            <User size={18} />
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
        <form onSubmit={handleSubmit} className="cm-form" noValidate>
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
                    className={`cm-input cm-input--icon ${fieldWarnings.first_name ? 'cm-input--error' : ''}`}
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    placeholder="Ingresa nombres"
                    required
                    autoComplete="given-name"
                  />
                </div>
                {fieldWarnings.first_name && (
                  <span className="cm-field-warning">
                    <AlertTriangle size={12} /> {fieldWarnings.first_name}
                  </span>
                )}
              </div>

              <div className="cm-grid-2">
                <div className="cm-field">
                  <label className="cm-label" htmlFor="cm-lname-p">Apellido Paterno</label>
                  <input
                    id="cm-lname-p"
                    type="text"
                    className={`cm-input ${fieldWarnings.last_name_paternal ? 'cm-input--error' : ''}`}
                    value={formData.last_name_paternal}
                    onChange={(e) => setFormData({...formData, last_name_paternal: e.target.value})}
                    placeholder="Apellido paterno"
                    autoComplete="family-name"
                  />
                  {fieldWarnings.last_name_paternal && (
                    <span className="cm-field-warning">
                      <AlertTriangle size={12} /> {fieldWarnings.last_name_paternal}
                    </span>
                  )}
                </div>
                <div className="cm-field">
                  <label className="cm-label" htmlFor="cm-lname-m">Apellido Materno</label>
                  <input
                    id="cm-lname-m"
                    type="text"
                    className={`cm-input ${fieldWarnings.last_name_maternal ? 'cm-input--error' : ''}`}
                    value={formData.last_name_maternal}
                    onChange={(e) => setFormData({...formData, last_name_maternal: e.target.value})}
                    placeholder="Apellido materno"
                    autoComplete="additional-name"
                  />
                  {fieldWarnings.last_name_maternal && (
                    <span className="cm-field-warning">
                      <AlertTriangle size={12} /> {fieldWarnings.last_name_maternal}
                    </span>
                  )}
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
                      onChange={(e) => setPhoneCode(e.target.value)}
                      placeholder="+591"
                      maxLength={5}
                    />
                  </div>
                  <input
                    id="cm-phone-num"
                    type="tel"
                    className={`cm-input cm-phone-number ${fieldWarnings.phone ? 'cm-input--error' : ''}`}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Número de teléfono"
                    autoComplete="tel-national"
                  />
                </div>
                {fieldWarnings.phone && (
                  <span className="cm-field-warning">
                    <AlertTriangle size={12} /> {fieldWarnings.phone}
                  </span>
                )}
              </div>

              {/* Advertencia informativa si falta apellido o teléfono al habilitar cuenta web */}
              {createWebAccount && formData.first_name.trim() && (!formData.last_name_paternal.trim() || !phoneNumber.trim()) && (
                <div className="cm-alert-box cm-alert-warning">
                  <AlertTriangle size={15} className="cm-alert-icon" />
                  <div className="cm-alert-content">
                    <div className="cm-alert-title">Datos de perfil incompletos (Opcional)</div>
                    <div className="cm-alert-desc">
                      Se recomienda completar <strong>Apellido Paterno</strong>, <strong>Apellido Materno</strong> y <strong>Teléfono</strong> para que queden registrados completos en el perfil de usuario (<code>user_profiles</code>).
                    </div>
                  </div>
                </div>
              )}
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

              {!createWebAccount ? (
                <div className="cm-pos-notice fade-in">
                  <Store size={15} className="cm-pos-notice-icon" />
                  <span>
                    <strong>Registro como Cliente POS (Caja):</strong> Los datos personales se guardarán como cliente de tienda sin crear cuenta en <code>users</code> ni <code>user_profiles</code>.
                  </span>
                </div>
              ) : (
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
                        className={`cm-input cm-input--icon ${
                          emailCheck.status === 'active_exists' || emailCheck.status === 'deleted_under_60' || emailCheck.status === 'invalid_format'
                            ? 'cm-input--error'
                            : emailCheck.status === 'available' || emailCheck.status === 'deleted_over_60'
                            ? 'cm-input--success'
                            : ''
                        }`}
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="correo@ejemplo.com"
                        required={createWebAccount}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Vista previa del username generado sin dominio */}
                  {extractedUsername && (
                    <div className="cm-username-preview">
                      <div className="cm-username-preview-left">
                        <AtSign size={14} className="cm-username-icon" />
                        <span className="cm-username-label">Username a registrar (sin dominio):</span>
                      </div>
                      <span className="cm-username-badge">{extractedUsername}</span>
                    </div>
                  )}

                  {/* Estado de validación del correo */}
                  {emailCheck.checking && (
                    <div className="cm-alert-box cm-alert-info">
                      <Info size={15} className="cm-alert-icon" />
                      <div className="cm-alert-content">
                        <div className="cm-alert-desc">Verificando disponibilidad del correo electrónico...</div>
                      </div>
                    </div>
                  )}

                  {!emailCheck.checking && emailCheck.status === "invalid_format" && (
                    <div className="cm-alert-box cm-alert-danger">
                      <AlertCircle size={16} className="cm-alert-icon" />
                      <div className="cm-alert-content">
                        <div className="cm-alert-title">Formato de correo inválido</div>
                        <div className="cm-alert-desc">{emailCheck.message}</div>
                      </div>
                    </div>
                  )}

                  {!emailCheck.checking && emailCheck.status === "active_exists" && (
                    <div className="cm-alert-box cm-alert-danger">
                      <AlertCircle size={16} className="cm-alert-icon" />
                      <div className="cm-alert-content">
                        <div className="cm-alert-title">Correo registrado y activo</div>
                        <div className="cm-alert-desc">
                          {emailCheck.message}
                        </div>
                      </div>
                    </div>
                  )}

                  {!emailCheck.checking && emailCheck.status === "deleted_under_60" && (
                    <div className="cm-alert-box cm-alert-danger">
                      <AlertTriangle size={16} className="cm-alert-icon" />
                      <div className="cm-alert-content">
                        <div className="cm-alert-title">
                          Cuenta eliminada hace menos de 60 días ({emailCheck.days_deleted} día(s))
                        </div>
                        <div className="cm-alert-desc">
                          {emailCheck.message}
                        </div>
                      </div>
                    </div>
                  )}

                  {!emailCheck.checking && emailCheck.status === "deleted_over_60" && (
                    <div className="cm-alert-box cm-alert-warning">
                      <CheckCircle size={16} className="cm-alert-icon" />
                      <div className="cm-alert-content">
                        <div className="cm-alert-title">
                          Cuenta eliminada hace más de 60 días ({emailCheck.days_deleted} días)
                        </div>
                        <div className="cm-alert-desc">
                          {emailCheck.message}
                        </div>
                      </div>
                    </div>
                  )}

                  {!emailCheck.checking && emailCheck.status === "available" && (
                    <div className="cm-alert-box cm-alert-success">
                      <CheckCircle size={16} className="cm-alert-icon" />
                      <div className="cm-alert-content">
                        <div className="cm-alert-title">Correo disponible</div>
                        <div className="cm-alert-desc">
                          Se creará la cuenta en <code>users</code> con username <strong>{extractedUsername}</strong> y se registrarán Nombres, Apellidos y Teléfono en <code>user_profiles</code>.
                        </div>
                      </div>
                    </div>
                  )}

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
              disabled={loading || isEmailBlocked || hasPersonalWarnings}
              title={isEmailBlocked ? "Corrige el correo electrónico para continuar" : ""}
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

