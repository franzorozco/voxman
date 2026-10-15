import { useState, useEffect } from "react";
import { ShieldCheck, Clock, Send, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { verifyRegisterCode, resendRegisterCode } from "../../../../api/admin/auth";

export default function UserViewModal({ user, onClose, onUserUpdated }) {
  const [currentUser, setCurrentUser] = useState(user);
  const [verifyCodeInput, setVerifyCodeInput] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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
    <div className="modal-overlay">
      <div className="modal">

        <h2>Información del usuario</h2>

        <div className="user-view-grid">

          {/* ================= BASICO ================= */}
          <div>
            <strong>Email:</strong>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>{currentUser.email}</span>
              {currentUser.email && !currentUser.email.includes('@guest') && (
                currentUser.email_verified_at ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'rgba(16, 185, 129, 0.14)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <ShieldCheck size={12} /> Verificado
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.35)'
                    }}
                  >
                    <Clock size={12} /> Pendiente (24h)
                  </span>
                )
              )}
            </p>
          </div>

          <div style={{ gridColumn: currentUser.email_verified_at ? 'auto' : '1 / -1' }}>
            <strong>Verificación de Correo:</strong>
            <div style={{ marginTop: '6px' }}>
              {currentUser.email_verified_at ? (
                <span style={{ color: '#10b981', fontWeight: 600 }}>
                  Verificado el {new Date(currentUser.email_verified_at).toLocaleString()}
                </span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                    Pendiente de verificar (plazo de 24h)
                  </span>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={handleSendVerificationEmail}
                      disabled={resendingEmail || resendCooldown > 0}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(245, 158, 11, 0.45)',
                        background: 'rgba(245, 158, 11, 0.12)',
                        color: '#d97706',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: resendingEmail || resendCooldown > 0 ? 'not-allowed' : 'pointer',
                        opacity: resendingEmail || resendCooldown > 0 ? 0.65 : 1,
                      }}
                    >
                      <Send size={13} />
                      {resendingEmail
                        ? 'Enviando correo...'
                        : resendCooldown > 0
                        ? `Reenviar en ${resendCooldown}s`
                        : 'Enviar correo con código'}
                    </button>

                    <form
                      onSubmit={handleVerifyUserCode}
                      style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Código (6 dígitos)"
                        value={verifyCodeInput}
                        onChange={(e) => setVerifyCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        style={{
                          width: '145px',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-input)',
                          color: 'var(--text-main)',
                          fontSize: '13px',
                          fontWeight: 700,
                          letterSpacing: '2px',
                          textAlign: 'center',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={verifyingEmail || verifyCodeInput.length !== 6}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#10b981',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: verifyingEmail || verifyCodeInput.length !== 6 ? 'not-allowed' : 'pointer',
                          opacity: verifyingEmail || verifyCodeInput.length !== 6 ? 0.6 : 1,
                        }}
                      >
                        <Check size={13} />
                        {verifyingEmail ? 'Verificando...' : 'Confirmar código'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <strong>Username:</strong>
            <p>{user.username}</p>
          </div>

          <div>
            <strong>Nombre:</strong>
            <p>
              {user.profile?.first_name}{" "}
              {user.profile?.last_name_paternal}{" "}
              {user.profile?.last_name_maternal}
            </p>
          </div>

          <div>
            <strong>Teléfono:</strong>
            <p>{user.profile?.phone || "-"}</p>
          </div>

          <div>
            <strong>Estado:</strong>
            <p>{user.is_active ? "Activo" : "Inactivo"}</p>
          </div>

          {/* ================= TIPOS ================= */}
          <div>
            <strong>Tipo:</strong>
            <p>
              {user.owner?.is_active && "Owner "}
              {user.customer?.is_active && "Customer "}
              {user.employee?.is_active && "Employee "}
              {!user.owner?.is_active &&
               !user.customer?.is_active &&
               !user.employee?.is_active && "-"}
            </p>
          </div>

          {/* ================= ROLES ================= */}
          <div>
            <strong>Roles:</strong>
            <p>{user.roles?.map(r => r.name).join(", ") || "-"}</p>
          </div>

          {/* ================= CUSTOMER ================= */}
          {user.customer?.is_active && (
            <>
              <div>
                <strong>Código Cliente:</strong>
                <p>{user.customer.customer_code}</p>
              </div>

              <div>
                <strong>Puntos:</strong>
                <p>{user.customer.points}</p>
              </div>

              <div>
                <strong>Total Compras:</strong>
                <p>{user.customer.total_purchases}</p>
              </div>
            </>
          )}

          {/* ================= EMPLOYEE ================= */}
          {user.employee?.is_active && (
            <>
              <div>
                <strong>Código Empleado:</strong>
                <p>{user.employee.employee_code}</p>
              </div>

              <div>
                <strong>Rol Laboral:</strong>
                <p>{user.employee.role}</p>
              </div>

              <div>
                <strong>Sueldo Base:</strong>
                <p>${user.employee.base_salary}</p>
              </div>

              <div>
                <strong>Comisión:</strong>
                <p>{user.employee.commission_percentage}%</p>
              </div>
            </>
          )}

          {/* ================= FECHA ================= */}
          <div>
            <strong>Creado:</strong>
            <p>{new Date(user.created_at).toLocaleString()}</p>
          </div>

        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}