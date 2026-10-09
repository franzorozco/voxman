import { useState, useEffect } from "react";
import { registerUser, getGoogleAuthUrl } from "../../api/admin/auth";
import { useAuthStore } from "../../store/authStore";
import { useShopSettingsStore } from "../../store/shop/useShopSettingsStore";
import { getImageUrl } from "../../utils/imageUtils";
import toast from "react-hot-toast";
import "./Auth.css";
import { useNavigate, Link, useLocation } from "react-router-dom";
import fondo from "../../assets/global/fondos/premium_fashion_bg.png";
import { Mail, Lock, User, UserCheck, Eye, EyeOff, AlertCircle, CheckCircle, ShieldAlert, Shield, ShieldCheck, Phone, ArrowLeft } from "lucide-react";

export default function Register() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { settings, fetchSettings } = useShopSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isGoogleReg, setIsGoogleReg] = useState(false);
  const [googleRegToken, setGoogleRegToken] = useState("");

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    password_confirmation: "",
    first_name: "",
    last_name_paternal: "",
    last_name_maternal: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("google_reg_token");
    const email = params.get("email");

    const nameStr = params.get("name") || "";

    if (token) {
      setIsGoogleReg(true);
      setGoogleRegToken(token);
      
      let defaultUsername = "";
      if (email) {
        defaultUsername = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, '');
      }

      let firstName = "";
      let lastName = "";
      if (nameStr) {
        const parts = nameStr.split(' ');
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(' ') || "";
      }

      setForm(prev => ({
        ...prev,
        email: email || "",
        username: defaultUsername,
        first_name: firstName,
        last_name_paternal: lastName
      }));
    }
  }, [location]);

  // VALIDACIONES
  const validate = (name, value) => {
    let error = "";

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) error = "Correo inválido";
    }

    if (name === "username") {
      if (value.length < 3) error = "Mínimo 3 caracteres";
      else if (/\s/.test(value)) error = "Sin espacios";
      else {
        const userRegex = /^[a-zA-Z0-9_]+$/;
        if (!userRegex.test(value)) error = "Solo letras, números y guiones bajos";
      }
    }

    if (name === "password") {
      const hasNumbers = /\d/.test(value);
      const hasLetters = /[a-zA-Z]/.test(value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

      if (value.length < 8) {
        error = "Mínimo 8 caracteres";
        setPasswordStrength("");
      } else if (value.length > 72) {
        error = "Máximo 72 caracteres";
      } else if (!hasLetters || !hasNumbers) {
        error = "Debe incluir letras y números";
        setPasswordStrength("Débil");
      } else if (hasSpecial) {
        setPasswordStrength("Fuerte");
      } else {
        setPasswordStrength("Media");
      }
    }

    if (name === "password_confirmation") {
      if (value !== form.password) {
        error = "Las contraseñas no coinciden";
      }
    }

    if (name === "username") {
      if (value.length < 3) error = "Mínimo 3 caracteres";
      else if (/\s/.test(value)) error = "Sin espacios";
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    validate(name, value);
    if (name === "email") {
      const prefix = value.split("@")[0].replace(/[^a-zA-Z0-9_]/g, '');
      validate("username", prefix);
    }
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

    if (!acceptedTerms) {
      toast.error("Debes aceptar los términos y condiciones");
      return;
    }

    if (isGoogleReg) {
      if (!form.username || !form.first_name) {
        toast.error("El nombre de usuario y nombre son obligatorios");
        return;
      }
      try {
        setLoading(true);
        const { completeGoogleRegistration } = await import("../../api/admin/auth");
        const res = await completeGoogleRegistration({ ...form, google_reg_token: googleRegToken });
        
        if (res && res.data) {
          setSuccess(true);
          useAuthStore.getState().login({ user: res.data.user, token: res.data.token });
          setTimeout(() => {
            navigate("/");
          }, 1200);
        }
      } catch (error) {
        if (!error.response || error.code === "ERR_NETWORK") {
          toast.error("No se pudo conectar con el servidor de autenticación. Revisa tu conexión.", { id: 'network-error-toast' });
        } else {
          toast.error(error.response?.data?.message || "Error al completar registro con Google");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (Object.values(errors).some((err) => err) || !form.username || !form.email || !form.password || !form.password_confirmation) {
      toast.error("Corrige los errores");
      return;
    }

    try {
      setLoading(true);
      const res = await registerUser(form);

      if (res && res.data) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 1200);
      }
    } catch (error) {
      if (!error.response || error.code === "ERR_NETWORK") {
        toast.error("No se pudo conectar con el servidor de autenticación. Revisa tu conexión.", { id: 'network-error-toast' });
      } else {
        toast.error(error.response?.data?.message || "Error en registro");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStrengthIcon = () => {
    if (!passwordStrength) return null;
    const str = passwordStrength.toLowerCase();
    if (str === "débil") return <ShieldAlert size={14} />;
    if (str === "media") return <Shield size={14} />;
    if (str === "fuerte") return <ShieldCheck size={14} />;
    return null;
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
        <div className="auth-form-side" style={{ overflowY: 'auto' }}>

          <div className="auth-logo-container">
            <img src={logoUrl} alt="VOXMAN Logo" />
          </div>
          <p className="auth-subtitle">Únete al estilo</p>

          {success ? (
            <div className="success-message">
              <CheckCircle size={48} color="#33d9b2" />
              <span>Usuario registrado</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              
              {/* EMAIL */}
              <div className="floating-input-group" style={{ marginBottom: errors.email && !isGoogleReg ? '30px' : '20px' }}>
                <Mail size={18} className="input-icon" />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={150}
                  placeholder=" "
                  value={form.email}
                  onChange={handleChange}
                  disabled={isGoogleReg}
                  className="floating-input"
                  style={{ borderColor: errors.email && !isGoogleReg ? '#ef4444' : undefined }}
                />
                <label className="floating-label">Correo electrónico</label>
                {errors.email && !isGoogleReg && (
                  <div style={{ position: 'absolute', bottom: '-22px', left: 0, display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px' }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }}/>
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* USERNAME */}
              <div className="floating-input-group" style={{ marginBottom: errors.username ? '30px' : '20px' }}>
                <User size={18} className="input-icon" />
                <input
                  name="username"
                  autoComplete="username"
                  maxLength={50}
                  placeholder=" "
                  value={form.username}
                  onChange={handleChange}
                  className="floating-input"
                  style={{ borderColor: errors.username ? '#ef4444' : undefined }}
                />
                <label className="floating-label">Nombre de la cuenta</label>
                {errors.username && (
                  <div style={{ position: 'absolute', bottom: '-22px', left: 0, display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px' }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }}/>
                    <span>{errors.username}</span>
                  </div>
                )}
              </div>

              {isGoogleReg ? (
                <>
                  <div className="floating-input-group">
                    <UserCheck size={18} className="input-icon" />
                    <input name="first_name" maxLength={100} placeholder=" " value={form.first_name} onChange={handleChange} required className="floating-input" />
                    <label className="floating-label">Nombre(s)</label>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="floating-input-group" style={{ flex: 1 }}>
                      <input name="last_name_paternal" maxLength={100} placeholder=" " value={form.last_name_paternal} onChange={handleChange} className="floating-input" style={{ paddingLeft: '16px' }} />
                      <label className="floating-label" style={{ left: '16px' }}>Ap. Paterno</label>
                    </div>
                    <div className="floating-input-group" style={{ flex: 1 }}>
                      <input name="last_name_maternal" maxLength={100} placeholder=" " value={form.last_name_maternal} onChange={handleChange} className="floating-input" style={{ paddingLeft: '16px' }} />
                      <label className="floating-label" style={{ left: '16px' }}>Ap. Materno</label>
                    </div>
                  </div>
                  <div className="floating-input-group">
                    <Phone size={18} className="input-icon" />
                    <input name="phone" type="tel" inputMode="tel" maxLength={30} placeholder=" " value={form.phone} onChange={handleChange} className="floating-input" />
                    <label className="floating-label">Teléfono</label>
                  </div>
                </>
              ) : (
                <>
                  {/* PASSWORD */}
                  <div className="password-group">
                    <div className="floating-input-group" style={{ marginBottom: 8 }}>
                      <Lock size={18} className="input-icon" />
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        maxLength={72}
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
                    </div>

                    {/* BARRA DE SEGURIDAD */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 4px' }}>
                      <div style={{ flex: 1, height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden', marginRight: '12px' }}>
                        <div style={{
                          height: '100%',
                          width: passwordStrength === 'Débil' ? '33%' : passwordStrength === 'Media' ? '66%' : passwordStrength === 'Fuerte' ? '100%' : '0%',
                          backgroundColor: passwordStrength === 'Débil' ? '#ef4444' : passwordStrength === 'Media' ? '#f59e0b' : passwordStrength === 'Fuerte' ? '#10b981' : 'transparent',
                          transition: 'all 0.4s ease'
                        }}></div>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', color: passwordStrength === 'Débil' ? '#ef4444' : passwordStrength === 'Media' ? '#f59e0b' : passwordStrength === 'Fuerte' ? '#10b981' : '#777' }}>
                        {renderStrengthIcon()} {passwordStrength || "—"}
                      </div>
                    </div>
                  </div>

                  {errors.password && (
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px', marginTop: '-12px', marginBottom: '16px', paddingLeft: '4px' }}>
                      <AlertCircle size={14} style={{ flexShrink: 0 }}/>
                      <span>{errors.password}</span>
                    </div>
                  )}

                  {/* CONFIRM PASSWORD */}
                  <div className="floating-input-group" style={{ marginBottom: errors.password_confirmation ? '30px' : '20px' }}>
                    <Lock size={18} className="input-icon" />
                    <input
                      name="password_confirmation"
                      type={showPassword ? "text" : "password"}
                      placeholder=" "
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
                </>
              )}

              {/* TERMS AND CONDITIONS */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={acceptedTerms} 
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                />
                <label htmlFor="terms" style={{ fontSize: '13px', color: '#ccc', cursor: 'pointer' }}>
                  Acepto los <span style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }}>Términos y Condiciones</span>
                </label>
              </div>

              <button type="submit" className="auth-btn-primary" disabled={!acceptedTerms || loading} style={{ opacity: (!acceptedTerms || loading) ? 0.7 : 1, cursor: (!acceptedTerms || loading) ? 'not-allowed' : 'pointer' }}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : (
                  isGoogleReg ? "Completar Registro" : "Crear cuenta"
                )}
              </button>

              {!isGoogleReg && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
                    <span style={{ padding: '0 10px', color: '#777', fontSize: '12px' }}>O REGÍSTRATE CON</span>
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
                </>
              )}

              <div className="auth-footer">
                ¿Ya tienes cuenta?
                <Link to="/login" className="auth-link">Inicia sesión</Link>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* TERMS MODAL */}
      {showTermsModal && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%', background: 'var(--bg-card, #1f2937)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', color: 'var(--text-main)' }}>Términos y Condiciones</h3>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
              <p>1. <strong>Aceptación:</strong> Al crear una cuenta, aceptas estar sujeto a estos términos y condiciones.</p>
              <p>2. <strong>Uso de cuenta:</strong> Eres responsable de mantener la confidencialidad de tu contraseña.</p>
              <p>3. <strong>Privacidad:</strong> Tu información personal será tratada conforme a nuestra política de privacidad.</p>
              <p><em>(Aquí puedes agregar todo el texto legal de tu empresa más adelante...)</em></p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                onClick={() => setShowTermsModal(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}