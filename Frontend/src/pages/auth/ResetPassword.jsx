import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../api/admin/auth";
import { useShopSettingsStore } from "../../store/shop/useShopSettingsStore";
import { getImageUrl } from "../../utils/imageUtils";
import toast from "react-hot-toast";
import "./Auth.css"; 

import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import fondo from "../../assets/global/fondos/premium_fashion_bg.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { settings, fetchSettings } = useShopSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [form, setForm] = useState({
    token: token || "",
    email: emailParam,
    password: "",
    password_confirmation: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = (name, value) => {
    let error = "";
    if (name === "password") {
      if (value.length < 8) error = "Mínimo 8 caracteres";
      else if (value.length > 72) error = "Máximo 72 caracteres";
      else if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) error = "Debe incluir letras y números";
    }
    if (name === "password_confirmation" && value !== form.password) {
      error = "Las contraseñas no coinciden";
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    validate(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.password || form.password !== form.password_confirmation) {
      toast.error("Revisa las contraseñas");
      return;
    }
    if (errors.password) {
      toast.error(errors.password);
      return;
    }

    try {
      setLoading(true);
      await resetPassword(form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al restablecer contraseña");
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
          <p className="auth-subtitle">Nueva contraseña</p>

          {success ? (
            <div className="success-message" style={{ textAlign: 'center' }}>
              <CheckCircle size={48} color="#33d9b2" style={{ margin: '0 auto 16px' }} />
              <span style={{ display: 'block', marginBottom: '8px' }}>¡Contraseña actualizada!</span>
              <p style={{ color: '#aaa', fontSize: '14px' }}>Serás redirigido al inicio de sesión.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '24px', textAlign: 'center' }}>
                Crea una nueva contraseña para tu cuenta <strong>{form.email}</strong>.
              </p>

              <div className="floating-input-group" style={{ marginBottom: errors.password ? '30px' : '20px' }}>
                <Lock size={18} className="input-icon" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  value={form.password}
                  onChange={handleChange}
                  className="floating-input"
                  style={{ borderColor: errors.password ? '#ef4444' : undefined }}
                />
                <label className="floating-label">Nueva contraseña</label>
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.password && (
                  <div style={{ position: 'absolute', bottom: '-22px', left: 0, display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px' }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }}/>
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              <div className="floating-input-group" style={{ marginBottom: errors.password_confirmation ? '30px' : '24px' }}>
                <Lock size={18} className="input-icon" />
                <input
                  name="password_confirmation"
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  value={form.password_confirmation}
                  onChange={handleChange}
                  className="floating-input"
                  style={{ borderColor: errors.password_confirmation ? '#ef4444' : undefined }}
                />
                <label className="floating-label">Confirmar contraseña</label>
                {errors.password_confirmation && (
                  <div style={{ position: 'absolute', bottom: '-22px', left: 0, display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px' }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }}/>
                    <span>{errors.password_confirmation}</span>
                  </div>
                )}
              </div>

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : (
                  "Restablecer contraseña"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
