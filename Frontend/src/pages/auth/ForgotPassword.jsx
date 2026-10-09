import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword } from "../../api/admin/auth";
import { useShopSettingsStore } from "../../store/shop/useShopSettingsStore";
import { getImageUrl } from "../../utils/imageUtils";
import toast from "react-hot-toast";
import "./Auth.css"; 

import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import fondo from "../../assets/global/fondos/premium_fashion_bg.png";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { settings, fetchSettings } = useShopSettingsStore();
  
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Por favor ingresa tu correo");
      return;
    }

    try {
      setLoading(true);
      await forgotPassword({ email });
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al solicitar el enlace");
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = settings?.store_logo_dark 
    ? getImageUrl(settings.store_logo_dark) 
    : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/lodo_default_for_black.png';

  return (
    <div className="auth-page-wrapper">
      <div className="auth-split-container">
        
        {/* Left Side: Image */}
        <div className="auth-image-side" style={{ backgroundImage: `url(${fondo})` }}></div>

        {/* Right Side: Form */}
        <div className="auth-form-side">
          <div className="auth-logo-container">
            <img src={logoUrl} alt="VOXMAN Logo" />
          </div>
          <p className="auth-subtitle">Recuperar contraseña</p>

          {success ? (
            <div className="success-message" style={{ textAlign: 'center' }}>
              <CheckCircle size={48} color="#33d9b2" style={{ margin: '0 auto 16px' }} />
              <span style={{ display: 'block', marginBottom: '8px' }}>¡Solicitud recibida!</span>
              <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.5', marginTop: '10px' }}>
                Si <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada o carpeta de spam.
              </p>
              <button 
                className="auth-btn-primary" 
                onClick={() => navigate('/login')}
                style={{ marginTop: '20px' }}
              >
                Volver al Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5', textAlign: 'center' }}>
                Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <div className="floating-input-group" style={{ marginBottom: error ? '30px' : '20px' }}>
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="floating-input"
                  style={{ borderColor: error ? '#ef4444' : undefined }}
                />
                <label className="floating-label">Correo electrónico</label>
                {error && (
                  <div style={{ position: 'absolute', bottom: '-22px', left: 0, display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px' }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }}/>
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : (
                  "Enviar enlace"
                )}
              </button>

              <div className="auth-footer">
                ¿Recordaste tu contraseña?
                <Link to="/login" className="auth-link">Inicia sesión</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
