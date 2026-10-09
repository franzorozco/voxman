import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, getGoogleAuthUrl } from "../../api/admin/auth";
import { useAuthStore } from "../../store/authStore";
import { useShopSettingsStore } from "../../store/shop/useShopSettingsStore";
import { getImageUrl } from "../../utils/imageUtils";
import toast from "react-hot-toast";
import "./Auth.css"; 

import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import fondo from "../../assets/global/fondos/premium_fashion_bg.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { settings, fetchSettings } = useShopSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  // VALIDACIÓN
  const validate = (name, value) => {
    let error = "";

    if (name === "email") {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(value)) error = "Correo inválido";
    }

    if (name === "password") {
      if (!value) error = "Ingresa tu contraseña";
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    validate(name, value);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const res = await getGoogleAuthUrl();
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      toast.error("Error al conectar con Google");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error("Ingresa tu correo y contraseña");
      return;
    }
    if (loading) return;

    try {
      setLoading(true);

      const res = await loginUser({ ...form, remember });
      const token = res.data?.token;
      const user = res.data?.user;

      if (!token) throw new Error("No llegó token del backend");

      // GUARDAR EN LOCALSTORAGE
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      login({ user, token });

      setSuccess(true);

      setTimeout(() => navigate("/"), 1200);

    } catch (error) {
      if (!error.response || error.code === "ERR_NETWORK") {
        toast.error("No se pudo conectar con el servidor de autenticación. Revisa tu conexión.", { id: 'network-error-toast' });
      } else if (error.response?.status === 429) {
        toast.error(error.response?.data?.message || "Demasiados intentos. Espera unos minutos.");
      } else {
        toast.error(error.response?.data?.message || "Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = settings?.store_logo_dark 
    ? getImageUrl(settings.store_logo_dark) 
    : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/lodo_default_for_black.png';

  return (
    <div className="auth-page-wrapper">
      <button 
        type="button" 
        onClick={() => navigate(-1)}
        className="auth-back-btn"
      >
        <ArrowLeft size={18} /> Volver
      </button>

      <div className="auth-split-container">
        
        {/* Left Side: Image */}
        <div className="auth-image-side" style={{ backgroundImage: `url(${fondo})` }}></div>

        {/* Right Side: Form */}
        <div className="auth-form-side">

          <div className="auth-logo-container">
            <img src={logoUrl} alt="VOXMAN Logo" />
          </div>
          <p className="auth-subtitle">Bienvenido de vuelta</p>

          {success ? (
            <div className="success-message">
              <CheckCircle size={48} color="#33d9b2" />
              <span>Inicio exitoso</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              
              {/* EMAIL */}
              <div className="floating-input-group" style={{ marginBottom: errors.email ? '30px' : '20px' }}>
                <Mail size={18} className="input-icon" />
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  maxLength={150}
                  placeholder=" "
                  onChange={handleChange}
                  className="floating-input"
                  style={{ borderColor: errors.email ? '#ef4444' : undefined }}
                />
                <label className="floating-label">Correo electrónico</label>
                {errors.email && (
                  <div style={{ position: 'absolute', bottom: '-22px', left: 0, display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px' }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} /> 
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* PASSWORD */}
              <div className="floating-input-group" style={{ marginBottom: errors.password ? '30px' : '20px' }}>
                <Lock size={18} className="input-icon" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  maxLength={255}
                  placeholder=" "
                  onChange={handleChange}
                  className="floating-input"
                  style={{ borderColor: errors.password ? '#ef4444' : undefined }}
                />
                <label className="floating-label">Contraseña</label>
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
                    <AlertCircle size={14} style={{ flexShrink: 0 }} /> 
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    id="remember" 
                    checked={remember} 
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ fontSize: '13px', color: '#ccc' }}>Recordarme</span>
                </label>
                <Link to="/forgot-password" style={{ color: 'var(--color-primary)', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : (
                  "Ingresar"
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
                <span style={{ padding: '0 10px', color: '#777', fontSize: '12px' }}>O INICIA CON</span>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
              </div>

              <button 
                type="button" 
                onClick={handleGoogleLogin} 
                disabled={loading}
                className="auth-btn-google"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>

              <div className="auth-footer">
                ¿No tienes una cuenta?
                <Link to="/register" className="auth-link">Únete al estilo</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}