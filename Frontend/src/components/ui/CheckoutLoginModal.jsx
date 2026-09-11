import React, { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, X, User, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { loginShopUser, registerShopUser } from "../../api/shop/auth";
import { getGoogleAuthUrl } from "../../api/admin/auth";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { Link } from "react-router-dom";

export default function CheckoutLoginModal({ isOpen, onClose, onSuccessRedirect, theme = 'light', initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState({});
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
      setForm({ email: "", username: "", password: "", password_confirmation: "" });
      setErrors({});
      setSuccess(false);
      setShowPassword(false);
      setPasswordStrength("");
    }
  }, [isOpen]);

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
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(value)) error = "Correo inválido";
    }
    if (name === "password") {
      if (mode === 'register') {
        let strength = "Débil";
        const hasUpper = /[A-Z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSymbol = /[^A-Za-z0-9]/.test(value);

        if (value.length >= 6) strength = "Media";
        if (value.length >= 8 && hasUpper && hasNumber && hasSymbol) {
          strength = "Fuerte";
        }
        setPasswordStrength(strength);
      }

      if (value.length < 6) {
        error = "Mínimo 6 caracteres";
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
    if (name === "username") {
      const userRegex = /^[a-zA-Z0-9_]+$/;
      if (!userRegex.test(value)) {
        error = "Solo letras, números y _";
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
      const res = await getGoogleAuthUrl();
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

  const renderInput = (name, placeholder, type = "text", Icon) => (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: inputBg,
        border: `1px solid ${errors[name] ? '#ef4444' : borderColor}`,
        borderRadius: '8px',
        padding: '0 12px',
        transition: 'border-color 0.2s'
      }}>
        <Icon size={18} color={mutedColor} />
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={form[name]}
          onChange={handleChange}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            padding: '12px',
            color: textColor,
            fontSize: '15px',
            outline: 'none'
          }}
        />
        {name === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex="-1"
            style={{
              background: 'transparent',
              border: 'none',
              color: mutedColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
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
          marginTop: '8px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{errors[name]}</span>
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: overlayBg,
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: modalBg,
        borderRadius: '16px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        position: 'relative',
        animation: 'modalSlideUp 0.3s ease-out',
        border: `1px solid ${borderColor}`,
        padding: '32px 24px'
      }}>
        
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

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ 
            margin: '0 0 4px 0', 
            fontSize: '24px', 
            fontWeight: '700', 
            letterSpacing: '0.05em',
            color: textColor 
          }}>
            VOXMAN
          </h2>
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
            
            {renderInput("email", "Correo electrónico", "email", Mail)}
            {mode === 'register' && renderInput("username", "Nombre de usuario", "text", User)}
            {renderInput("password", "Contraseña", showPassword ? "text" : "password", Lock)}
            {mode === 'register' && renderInput("password_confirmation", "Confirmar contraseña", showPassword ? "text" : "password", Lock)}

            {mode === 'login' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="remember" 
                    checked={remember} 
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: textColor }}
                  />
                  <label htmlFor="remember" style={{ fontSize: '13px', color: textColor, cursor: 'pointer' }}>
                    Recordarme
                  </label>
                </div>
                <Link to="/forgot-password" onClick={onClose} style={{ color: mutedColor, fontSize: '13px', textDecoration: 'underline', fontWeight: 600 }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}

            {mode === 'register' && (
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
              disabled={loading}
              style={{
                marginTop: '8px',
                width: '100%',
                background: textColor,
                color: modalBg,
                border: 'none',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'transform 0.1s, opacity 0.2s'
              }}
              onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {loading ? (mode === 'login' ? "Ingresando..." : "Creando cuenta...") : (mode === 'login' ? "Ingresar y Continuar" : "Registrarse y Continuar")}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: `1px solid ${borderColor}` }} />
              <span style={{ padding: '0 10px', color: mutedColor, fontSize: '12px' }}>
                {mode === 'login' ? "O INICIA CON" : "O REGÍSTRATE CON"}
              </span>
              <hr style={{ flex: 1, border: 'none', borderTop: `1px solid ${borderColor}` }} />
            </div>

            <button 
              type="button" 
              onClick={handleGoogleLogin} 
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                background: 'transparent',
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = isDark ? '#374151' : '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

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

      {/* TERMS MODAL */}
      {showTermsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
