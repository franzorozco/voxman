import React, { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, X, User, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { loginShopUser, registerShopUser } from "../../api/shop/auth";
import { getGoogleAuthUrl } from "../../api/admin/auth";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { Link } from "react-router-dom";
import { useShopSettingsStore } from "../../store/shop/useShopSettingsStore";
import { getImageUrl } from "../../utils/imageUtils";
import fondo from "../../assets/global/fondos/premium_fashion_bg.png";
import "./CheckoutLoginModal.css";

export default function CheckoutLoginModal({ isOpen, onClose, onSuccessRedirect, theme = 'light', initialMode = 'login', initialData = null }) {
  const { settings, fetchSettings } = useShopSettingsStore();

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen, fetchSettings]);
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'google_register'
  
  const [form, setForm] = useState({ 
    username: "", 
    email: "", 
    password: "", 
    password_confirmation: "",
    first_name: "",
    last_name_paternal: "",
    last_name_maternal: "",
    phone: ""
  });
  const [errors, setErrors] = useState({});
  const [googleRegToken, setGoogleRegToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [remember, setRemember] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  // Reset state when opening/closing or switching modes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrors({});
      setAcceptedTerms(false);
      setSuccess(false);
      setShowPassword(false);
      setPasswordStrength("");
      
      if (initialMode === 'google_register' && initialData) {
        setGoogleRegToken(initialData.googleRegToken);
        
        let defaultUsername = "";
        if (initialData.email) {
          defaultUsername = initialData.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
        }

        let firstName = "";
        let lastName = "";
        if (initialData.name) {
          const parts = initialData.name.split(' ');
          firstName = parts[0] || "";
          lastName = parts.slice(1).join(' ') || "";
        }

        setForm({
          username: defaultUsername,
          email: initialData.email || "",
          password: "",
          password_confirmation: "",
          first_name: firstName,
          last_name_paternal: lastName,
          last_name_maternal: "",
          phone: ""
        });
      } else {
        setGoogleRegToken("");
        setForm({
          username: "",
          email: "",
          password: "",
          password_confirmation: "",
          first_name: "",
          last_name_paternal: "",
          last_name_maternal: "",
          phone: ""
        });
      }
    }
  }, [isOpen, initialMode, initialData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // VALIDACIÓN
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
      if (mode === 'register') {
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
      } else {
        // En login solo validamos longitud mínima por seguridad básica
        if (value.length < 8) {
          error = "Mínimo 8 caracteres";
        }
      }

      if (mode === 'register' && form.password_confirmation && value !== form.password_confirmation) {
        setErrors((prev) => ({ ...prev, password_confirmation: "Las contraseñas no coinciden" }));
      } else if (mode === 'register' && form.password_confirmation && value === form.password_confirmation) {
        setErrors((prev) => ({ ...prev, password_confirmation: "" }));
      }
    }

    if (name === "password_confirmation") {
      if (value !== form.password) {
        error = "Las contraseñas no coinciden";
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setForm(prev => {
      const newForm = { ...prev, [name]: value };
      if (name === "email" && mode === 'register') {
        const prefix = value.split("@")[0].replace(/[^a-zA-Z0-9_]/g, '');
        newForm.username = prefix;
      }
      return newForm;
    });
    
    validate(name, value);
    if (name === "email" && mode === 'register') {
      const prefix = value.split("@")[0].replace(/[^a-zA-Z0-9_]/g, '');
      validate("username", prefix);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const res = await getGoogleAuthUrl('shop');
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      toast.error("Error al conectar con Google");
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await loginShopUser({ email: form.email, password: form.password, remember });
      const token = res.data?.token;
      const user = res.data?.user;

      if (!token) throw new Error("No llegó token del backend");

      localStorage.setItem("token", token);
      localStorage.setItem("shop_auth_token", token);
      localStorage.setItem("shop_user", JSON.stringify(user));
      
      // Update global session
      useAuthStore.getState().login({ user, token });

      setSuccessMessage("¡Bienvenido de vuelta!");
      setSuccess(true);

      setTimeout(() => {
        onClose();
        if (onSuccessRedirect) {
          onSuccessRedirect(user);
        }
      }, 1200);

    } catch (error) {
      console.log(error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!acceptedTerms) {
      toast.error("Debes aceptar los términos y condiciones");
      return;
    }

    if (mode === 'google_register') {
      if (Object.values(errors).some((err) => err)) {
        toast.error("Corrige los errores antes de continuar");
        return;
      }
      if (!form.username || !form.first_name) {
        toast.error("El nombre de usuario y nombre son obligatorios");
        return;
      }
      try {
        setLoading(true);
        const { completeGoogleRegistration } = await import("../../api/admin/auth");
        const res = await completeGoogleRegistration({ ...form, google_reg_token: googleRegToken });
        
        const token = res.data?.token;
        const user = res.data?.user;

        if (!token) throw new Error("No llegó token del backend");

        localStorage.setItem("token", token);
        localStorage.setItem("shop_auth_token", token);
        localStorage.setItem("shop_user", JSON.stringify(user));
        
        useAuthStore.getState().login({ user, token });

        setSuccessMessage("¡Cuenta creada con éxito!");
        setSuccess(true);
        setTimeout(() => {
          onClose();
          if (onSuccessRedirect) onSuccessRedirect(user);
        }, 1500);
      } catch (error) {
        toast.error(error.response?.data?.message || "Error al completar registro");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (Object.values(errors).some((err) => err) || !form.username || !form.email || !form.password || !form.password_confirmation) {
      toast.error("Corrige los errores antes de continuar");
      return;
    }

    try {
      setLoading(true);
      const res = await registerShopUser(form);
      const token = res.data?.token;
      const user = res.data?.user;

      if (!token) throw new Error("No llegó token del backend");

      localStorage.setItem("token", token);
      localStorage.setItem("shop_auth_token", token);
      localStorage.setItem("shop_user", JSON.stringify(user));
      
      // Update global session
      useAuthStore.getState().login({ user, token });

      if (res && res.data) {
        setSuccessMessage("¡Cuenta creada con éxito!");
        setSuccess(true);
        // Automatically login
        setTimeout(() => {
          onClose();
          if (onSuccessRedirect) {
            onSuccessRedirect(user);
          }
        }, 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error en registro");
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

  const isDark = theme === 'dark';
  const overlayBg = isDark ? "rgba(0, 0, 0, 0.85)" : "rgba(0, 0, 0, 0.6)";
  const modalBg = isDark ? "#111827" : "#ffffff";
  const textColor = isDark ? "#f3f4f6" : "#111827";
  const mutedColor = isDark ? "#9ca3af" : "#6b7280";
  const borderColor = isDark ? "#374151" : "#e5e7eb";
  const inputBg = isDark ? "#1f2937" : "#f9fafb";

  const renderInput = (name, placeholder, type = "text", Icon, maxLength = undefined) => (
    <div style={{ marginBottom: errors[name] ? '20px' : '0' }}>
      <div className="floating-input-group" style={{ marginBottom: 0 }}>
        <Icon size={18} className="input-icon" />
        <input
          name={name}
          type={name === "password" ? (showPassword ? "text" : "password") : type}
          placeholder=" "
          maxLength={maxLength}
          value={form[name]}
          onChange={handleChange}
          className="floating-input"
          style={{ borderColor: errors[name] ? '#ef4444' : undefined }}
        />
        <label className="floating-label">{placeholder}</label>
        {name === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex="-1"
            className="toggle-password-btn"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {name === "password" && mode === 'register' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '4px',
          marginBottom: '10px',
          padding: '0 4px'
        }}>
          <div style={{
            flex: 1,
            height: '4px',
            background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginRight: '12px'
          }}>
            <div style={{
              height: '100%',
              width: passwordStrength === 'Débil' ? '33%' : passwordStrength === 'Media' ? '66%' : passwordStrength === 'Fuerte' ? '100%' : '0%',
              backgroundColor: passwordStrength === 'Débil' ? '#ef4444' : passwordStrength === 'Media' ? '#f59e0b' : passwordStrength === 'Fuerte' ? '#10b981' : 'transparent',
              borderRadius: '4px',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}></div>
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: passwordStrength === 'Débil' ? '#ef4444' : passwordStrength === 'Media' ? '#f59e0b' : passwordStrength === 'Fuerte' ? '#10b981' : mutedColor
          }}>
            {renderStrengthIcon()} {passwordStrength || "—"}
          </div>
        </div>
      )}
      {errors[name] && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{errors[name]}</span>
        </div>
      )}
    </div>
  );

  const logoDark = settings?.store_logo_dark || settings?.store_logo_light;
  const logoLight = settings?.store_logo_light || settings?.store_logo_dark;

  const logoUrl = isDark 
    ? (logoDark ? getImageUrl(logoDark) : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/lodo_default_for_black.png')
    : (logoLight ? getImageUrl(logoLight) : 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/lodo_default_for_white.png');

  return (
    <div className={`checkout-modal-overlay ${isDark ? 'dark-theme' : ''}`} onClick={onClose}>
      <div className="checkout-modal-container" onClick={(e) => e.stopPropagation()}>
        
        <div className="checkout-modal-image" style={{ backgroundImage: `url(${fondo})` }}></div>
        
        <div className="checkout-modal-content">
        
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: mutedColor,
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X size={20} />
        </button>

        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src={logoUrl} alt="Logo" style={{ display: 'block', margin: '0 auto', height: '40px', objectFit: 'contain' }} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ margin: 0, color: mutedColor, fontSize: '14px' }}>
            {mode === 'login' ? "Iniciar sesión para continuar" : "Únete al estilo para continuar"}
          </p>
        </div>

        {success ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '32px 0',
            color: '#10b981'
          }}>
            <CheckCircle size={56} style={{ marginBottom: '16px' }} />
            <span style={{ fontSize: '18px', fontWeight: '500' }}>{successMessage}</span>
          </div>
        ) : (
          <form onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ marginBottom: errors["email"] && mode !== 'google_register' ? '20px' : '0' }}>
              <div className="floating-input-group" style={{ 
                opacity: mode === 'google_register' ? 0.7 : 1,
                marginBottom: 0
              }}>
                <Mail size={18} className="input-icon" />
                <input
                  name="email"
                  type="email"
                  maxLength={150}
                  placeholder=" "
                  value={form.email}
                  onChange={handleChange}
                  disabled={mode === 'google_register'}
                  className="floating-input"
                  style={{ 
                    borderColor: errors["email"] ? '#ef4444' : undefined,
                    cursor: mode === 'google_register' ? 'not-allowed' : 'text'
                  }}
                />
                <label className="floating-label">Correo electrónico</label>
              </div>
              {errors["email"] && mode !== 'google_register' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{errors["email"]}</span>
                </div>
              )}
            </div>

            {(mode === 'register' || mode === 'google_register') && renderInput("username", "Nombre de usuario", "text", User, 50)}
            
            {mode === 'google_register' ? (
              <>
                {renderInput("first_name", "Nombre(s)", "text", User, 100)}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>{renderInput("last_name_paternal", "Ap. Paterno", "text", User, 100)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>{renderInput("last_name_maternal", "Ap. Materno", "text", User, 100)}</div>
                </div>
                {renderInput("phone", "Teléfono", "text", User, 30)}
              </>
            ) : (
              <>
                {renderInput("password", "Contraseña", showPassword ? "text" : "password", Lock, 72)}
                {mode === 'register' && renderInput("password_confirmation", "Confirmar contraseña", showPassword ? "text" : "password", Lock, 72)}
              </>
            )}

            {mode === 'login' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="remember" 
                    checked={remember} 
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: textColor }}
                  />
                  <label htmlFor="remember" style={{ fontSize: '13px', color: textColor, cursor: 'pointer', marginBottom: 0 }}>
                    Recordarme
                  </label>
                </div>
                <Link to="/forgot-password" onClick={onClose} style={{ color: mutedColor, fontSize: '13px', textDecoration: 'underline', fontWeight: 600 }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}

            {(mode === 'register' || mode === 'google_register') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={acceptedTerms} 
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: textColor }}
                />
                <label htmlFor="terms" style={{ fontSize: '13px', color: textColor, cursor: 'pointer' }}>
                  Acepto los <span style={{ fontWeight: 600, textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }}>Términos y Condiciones</span>
                </label>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || ((mode === 'register' || mode === 'google_register') && !acceptedTerms)}
              className="checkout-modal-btn checkout-modal-btn-primary"
            >
              {loading ? (
                <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : (
                (mode === 'google_register' ? 'Completar Registro' : (mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'))
              )}
            </button>

            {mode !== 'google_register' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
                  <hr style={{ flex: 1, border: 'none', borderTop: `1px solid ${borderColor}` }} />
                  <span style={{ padding: '0 10px', color: mutedColor, fontSize: '12px' }}>O {mode === 'login' ? 'INICIA SESIÓN' : 'REGÍSTRATE'} CON</span>
                  <hr style={{ flex: 1, border: 'none', borderTop: `1px solid ${borderColor}` }} />
                </div>

                <button 
                  type="button" 
                  onClick={handleGoogleLogin} 
                  disabled={loading}
                  className="checkout-modal-btn checkout-modal-btn-google"
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

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <span style={{ color: mutedColor, fontSize: '13px' }}>
                {mode === 'login' ? "¿No tienes una cuenta? " : "¿Ya tienes cuenta? "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setErrors({});
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: textColor,
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                {mode === 'login' ? "Únete al estilo" : "Inicia sesión"}
              </button>
            </div>

          </form>
        )}
      </div>

      </div>
      
      {/* TERMS MODAL */}
      {showTermsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: '500px', width: '90%', backgroundColor: modalBg, borderRadius: '16px', padding: '24px', border: `1px solid ${borderColor}`, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', color: textColor }}>Términos y Condiciones</h3>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', color: mutedColor, fontSize: '14px', lineHeight: '1.6' }}>
              <p>1. <strong>Aceptación:</strong> Al crear una cuenta, aceptas estar sujeto a estos términos y condiciones.</p>
              <p>2. <strong>Uso de cuenta:</strong> Eres responsable de mantener la confidencialidad de tu contraseña.</p>
              <p>3. <strong>Privacidad:</strong> Tu información personal será tratada conforme a nuestra política de privacidad.</p>
              <p><em>(Aquí puedes agregar todo el texto legal de tu empresa más adelante...)</em></p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                onClick={() => setShowTermsModal(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: textColor, color: modalBg, cursor: 'pointer', fontWeight: 600 }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
