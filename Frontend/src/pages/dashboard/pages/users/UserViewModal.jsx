import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Clock,
  Send,
  Check,
  X,
  Mail,
  Phone,
  User,
  Calendar,
  Award,
  ShoppingBag,
  Briefcase,
  DollarSign,
  Percent,
  Copy,
  CheckCheck,
  Shield,
  Layers,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { verifyRegisterCode, resendRegisterCode } from "../../../../api/admin/auth";
import {
  getUserOrigin,
  getUserVerification,
  getUserFullName,
  getUserInitials,
  formatDate,
  GoogleIcon,
} from "./userHelpers";

export default function UserViewModal({ user, onClose, onUserUpdated }) {
  const [currentUser, setCurrentUser] = useState(user);
  const [verifyCodeInput, setVerifyCodeInput] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!currentUser) return null;

  const originInfo = getUserOrigin(currentUser);
  const verificationInfo = getUserVerification(currentUser);
  const fullName = getUserFullName(currentUser);
  const initials = getUserInitials(currentUser);

  const handleCopy = (text, fieldName) => {
    if (!text || text === "-") return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copiado al portapapeles`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSendVerificationEmail = async () => {
    if (!currentUser.email || resendingEmail || resendCooldown > 0) return;
    try {
      setResendingEmail(true);
      const res = await resendRegisterCode({ email: currentUser.email });
      toast.success(res.data?.message || `Código de verificación enviado a ${currentUser.email}`);
      setResendCooldown(res.data?.cooldown_seconds || 60);
    } catch (error) {
      if (error.response?.data?.cooldown_seconds) {
        setResendCooldown(error.response.data.cooldown_seconds);
      }
      toast.error(error.response?.data?.message || "No se pudo enviar el correo de verificación");
    } finally {
      setResendingEmail(false);
    }
  };

  const handleVerifyUserCode = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = (verifyCodeInput || "").replace(/\D/g, "").trim();
    if (cleanCode.length !== 6) {
      toast.error("Ingresa el código de 6 dígitos enviado al correo del usuario");
      return;
    }
    try {
      setVerifyingEmail(true);
      const res = await verifyRegisterCode({
        email: currentUser.email,
        code: cleanCode,
      });
      const verifiedAt = res.data?.user?.email_verified_at || new Date().toISOString();
      const updated = { ...currentUser, email_verified_at: verifiedAt };
      setCurrentUser(updated);
      setVerifyCodeInput("");
      toast.success(res.data?.message || "Correo del usuario verificado correctamente");
      if (onUserUpdated) onUserUpdated(updated);
    } catch (error) {
      toast.error(error.response?.data?.message || "Código inválido o expirado");
    } finally {
      setVerifyingEmail(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-view-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* ================= HEADER REMASTERIZADO ================= */}
        <div className="user-view-header">
          <div className="user-view-header-left">
            <div className="user-view-avatar-wrap">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={fullName}
                  className="user-view-avatar-img"
                />
              ) : (
                <div className="user-view-avatar-fallback">{initials}</div>
              )}
              <span
                className={`user-view-status-dot ${
                  currentUser.is_active ? "dot-active" : "dot-inactive"
                }`}
                title={currentUser.is_active ? "Usuario activo" : "Usuario inactivo"}
              />
            </div>

            <div className="user-view-identity">
              <div className="user-view-name-row">
                <h2 className="user-view-name">{fullName}</h2>
                <span className="user-view-id-badge">ID #{currentUser.id}</span>
              </div>
              <p className="user-view-username">@{currentUser.username}</p>

              {/* Badges de Estado, Origen y Verificación */}
              <div className="user-view-badges-strip">
                {/* Estado */}
                <span
                  className={`user-pill ${
                    currentUser.is_active ? "pill-success" : "pill-muted"
                  }`}
                >
                  <span
                    className={`pill-dot ${
                      currentUser.is_active ? "dot-success" : "dot-muted"
                    }`}
                  />
                  {currentUser.is_active ? "Activo" : "Inactivo"}
                </span>

                {/* Canal de Origen (Google / POS / Web / Interno) */}
                <span className={`user-pill pill-origin pill-origin-${originInfo.type}`}>
                  {originInfo.icon}
                  <span>{originInfo.label}</span>
                </span>

                {/* Verificación de correo */}
                <span className={`user-pill pill-verify-${verificationInfo.statusClass}`}>
                  {verificationInfo.icon}
                  <span>{verificationInfo.label}</span>
                </span>

                {/* Tipos de cuenta */}
                {currentUser.owner?.is_active && (
                  <span className="user-pill pill-role pill-owner">Owner</span>
                )}
                {currentUser.customer?.is_active && (
                  <span className="user-pill pill-role pill-customer">Cliente</span>
                )}
                {currentUser.employee?.is_active && (
                  <span className="user-pill pill-role pill-employee">Empleado</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="user-view-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
            title="Cerrar (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* ================= CUERPO / SECCIONES ================= */}
        <div className="user-view-body">
          {/* ================= 1. GESTIÓN DE VERIFICACIÓN ================= */}
          <div className="user-section-card">
            <div className="user-section-card-header">
              <div className="user-section-title-wrap">
                <Shield size={16} className="user-section-icon" />
                <h3 className="user-section-title">Seguridad y Verificación</h3>
              </div>
              <span className="user-section-tag">
                {verificationInfo.verified ? "Cuenta Confirmada" : "Acción Requerida"}
              </span>
            </div>

            {verificationInfo.verified ? (
              <div className="user-verify-banner verified">
                <div className="user-verify-icon-wrap verified">
                  <ShieldCheck size={20} />
                </div>
                <div className="user-verify-content">
                  <span className="user-verify-title">
                    {originInfo.isGoogle
                      ? "Verificado automáticamente vía Google OAuth"
                      : "Correo electrónico confirmado y verificado"}
                  </span>
                  <span className="user-verify-subtitle">
                    {currentUser.email_verified_at
                      ? `Fecha de verificación: ${formatDate(currentUser.email_verified_at, true)}`
                      : "La identidad ha sido comprobada de forma segura por el proveedor."}
                  </span>
                </div>
              </div>
            ) : verificationInfo.isGuest ? (
              <div className="user-verify-banner guest">
                <div className="user-verify-icon-wrap guest">
                  <Clock size={20} />
                </div>
                <div className="user-verify-content">
                  <span className="user-verify-title">Cliente Rápido de Tienda POS</span>
                  <span className="user-verify-subtitle">
                    Esta cuenta fue generada para compras presenciales en punto de venta y no
                    requiere verificación de correo electrónico.
                  </span>
                </div>
              </div>
            ) : (
              <div className="user-verify-banner pending">
                <div className="user-verify-icon-wrap pending">
                  <Clock size={20} />
                </div>
                <div className="user-verify-content">
                  <div className="user-verify-header-row">
                    <span className="user-verify-title">Verificación de Correo Pendiente</span>
                    <span className="user-verify-deadline-badge">Plazo 24 horas</span>
                  </div>
                  <p className="user-verify-subtitle">
                    El usuario aún no ha confirmado el código enviado a su dirección de correo
                    electrónico ({currentUser.email}).
                  </p>

                  <div className="user-verify-actions">
                    <button
                      type="button"
                      onClick={handleSendVerificationEmail}
                      disabled={resendingEmail || resendCooldown > 0}
                      className="btn-send-code"
                    >
                      <Send size={13} />
                      {resendingEmail
                        ? "Enviando correo..."
                        : resendCooldown > 0
                        ? `Reenviar en ${resendCooldown}s`
                        : "Reenviar código al correo"}
                    </button>

                    <form onSubmit={handleVerifyUserCode} className="user-verify-form">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={verifyCodeInput}
                        onChange={(e) =>
                          setVerifyCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        className="user-code-input"
                        title="Código de 6 dígitos"
                      />
                      <button
                        type="submit"
                        disabled={verifyingEmail || verifyCodeInput.length !== 6}
                        className="btn-confirm-code"
                      >
                        <Check size={14} />
                        {verifyingEmail ? "Verificando..." : "Confirmar código"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ================= 2. DATOS DE CUENTA Y CONTACTO ================= */}
          <div className="user-section-card">
            <div className="user-section-card-header">
              <div className="user-section-title-wrap">
                <User size={16} className="user-section-icon" />
                <h3 className="user-section-title">Información de Cuenta</h3>
              </div>
            </div>

            <div className="user-details-grid">
              {/* Email */}
              <div className="user-detail-item">
                <div className="user-detail-header">
                  <span className="user-detail-label">
                    <Mail size={13} /> Correo Electrónico
                  </span>
                  <button
                    type="button"
                    className="user-copy-btn"
                    onClick={() => handleCopy(currentUser.email, "Email")}
                    title="Copiar email"
                  >
                    {copiedField === "Email" ? <CheckCheck size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <div className="user-detail-value-wrap">
                  <span className="user-detail-value">{currentUser.email || "-"}</span>
                </div>
              </div>

              {/* Teléfono */}
              <div className="user-detail-item">
                <div className="user-detail-header">
                  <span className="user-detail-label">
                    <Phone size={13} /> Teléfono de Contacto
                  </span>
                  {currentUser.profile?.phone && (
                    <button
                      type="button"
                      className="user-copy-btn"
                      onClick={() => handleCopy(currentUser.profile?.phone, "Teléfono")}
                      title="Copiar teléfono"
                    >
                      {copiedField === "Teléfono" ? <CheckCheck size={12} /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
                <span className="user-detail-value">
                  {currentUser.profile?.phone || "No registrado"}
                </span>
              </div>

              {/* Nombre de Usuario */}
              <div className="user-detail-item">
                <div className="user-detail-header">
                  <span className="user-detail-label">
                    <User size={13} /> Nombre de Usuario
                  </span>
                </div>
                <span className="user-detail-value">@{currentUser.username}</span>
              </div>

              {/* Fecha de Registro */}
              <div className="user-detail-item">
                <div className="user-detail-header">
                  <span className="user-detail-label">
                    <Calendar size={13} /> Registrado en el Sistema
                  </span>
                </div>
                <span className="user-detail-value">
                  {formatDate(currentUser.created_at, true)}
                </span>
              </div>
            </div>
          </div>

          {/* ================= 3. ROLES Y PERMISOS ================= */}
          <div className="user-section-card">
            <div className="user-section-card-header">
              <div className="user-section-title-wrap">
                <Layers size={16} className="user-section-icon" />
                <h3 className="user-section-title">Roles y Nivel de Acceso</h3>
              </div>
            </div>

            <div className="user-roles-container">
              {currentUser.roles && currentUser.roles.length > 0 ? (
                <div className="user-roles-chips">
                  {currentUser.roles.map((role) => (
                    <div key={role.id || role.name} className="user-role-chip">
                      <span className="user-role-chip-indicator" />
                      <span className="user-role-chip-name">{role.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="user-empty-hint">Sin roles administrativos asignados</p>
              )}
            </div>
          </div>

          {/* ================= 4. PERFIL DE CLIENTE (SI APLICA) ================= */}
          {currentUser.customer?.is_active && (
            <div className="user-section-card">
              <div className="user-section-card-header">
                <div className="user-section-title-wrap">
                  <ShoppingBag size={16} className="user-section-icon" />
                  <h3 className="user-section-title">Perfil Comercial / Cliente</h3>
                </div>
                <span className="user-section-tag">Módulo Clientes</span>
              </div>

              <div className="user-metrics-triplet">
                <div className="user-metric-box">
                  <span className="user-metric-label">Código Cliente</span>
                  <div className="user-metric-value-row">
                    <span className="user-metric-value code">
                      {currentUser.customer.customer_code}
                    </span>
                    <button
                      type="button"
                      className="user-copy-btn"
                      onClick={() =>
                        handleCopy(currentUser.customer.customer_code, "Código Cliente")
                      }
                      title="Copiar código de cliente"
                    >
                      {copiedField === "Código Cliente" ? (
                        <CheckCheck size={12} />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="user-metric-box">
                  <span className="user-metric-label">Puntos Acumulados</span>
                  <div className="user-metric-value-row">
                    <Award size={15} className="user-metric-icon-highlight" />
                    <span className="user-metric-value highlight">
                      {currentUser.customer.points || 0} pts
                    </span>
                  </div>
                </div>

                <div className="user-metric-box">
                  <span className="user-metric-label">Total Compras</span>
                  <div className="user-metric-value-row">
                    <span className="user-metric-value">
                      {currentUser.customer.total_purchases || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 5. PERFIL DE EMPLEADO (SI APLICA) ================= */}
          {currentUser.employee?.is_active && (
            <div className="user-section-card">
              <div className="user-section-card-header">
                <div className="user-section-title-wrap">
                  <Briefcase size={16} className="user-section-icon" />
                  <h3 className="user-section-title">Perfil Laboral / Empleado</h3>
                </div>
                <span className="user-section-tag">Personal Interno</span>
              </div>

              <div className="user-metrics-triplet user-metrics-four">
                <div className="user-metric-box">
                  <span className="user-metric-label">Código Empleado</span>
                  <span className="user-metric-value code">
                    {currentUser.employee.employee_code || "Sin código"}
                  </span>
                </div>

                <div className="user-metric-box">
                  <span className="user-metric-label">Cargo / Rol</span>
                  <span className="user-metric-value">
                    {currentUser.employee.role || "General"}
                  </span>
                </div>

                <div className="user-metric-box">
                  <span className="user-metric-label">Sueldo Base</span>
                  <div className="user-metric-value-row">
                    <DollarSign size={14} className="user-metric-icon-currency" />
                    <span className="user-metric-value">
                      Bs. {Number(currentUser.employee.base_salary || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="user-metric-box">
                  <span className="user-metric-label">Comisión</span>
                  <div className="user-metric-value-row">
                    <Percent size={13} className="user-metric-icon-currency" />
                    <span className="user-metric-value">
                      {currentUser.employee.commission_percentage || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="user-view-footer">
          <span className="user-footer-hint">
            Cuenta registrada: {formatDate(currentUser.created_at)}
          </span>
          <button type="button" className="btn-user-view-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}