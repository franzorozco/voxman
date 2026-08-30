import React, { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, X, User } from "lucide-react";
import { loginShopUser, registerShopUser } from "../../api/shopAuth";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";

export default function CheckoutLoginModal({ isOpen, onClose, onSuccessRedirect, theme = 'light' }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    first_name: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Reset state when opening/closing or switching modes
  useEffect(() => {
    if (isOpen) {
      setMode('login');
      setForm({ email: "", username: "", password: "", first_name: "" });
      setErrors({});
      setSuccess(false);
      setShowPassword(false);
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
      if (value.length < 6) {
        error = "Mínimo 6 caracteres";
      }
    }
    if (name === "username") {
      const userRegex = /^[a-zA-Z0-9_]+$/;
      if (!userRegex.test(value)) {
        error = "Solo letras, números y _";
      }
    }
    if (name === "first_name") {
      if (value.length < 2) {
        error = "Mínimo 2 caracteres";
      }
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    validate(name, value);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await loginShopUser({ email: form.email, password: form.password });
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
    if (Object.values(errors).some((err) => err) || !form.username || !form.email || !form.password || !form.first_name) {
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
      {errors[name] && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>
          <AlertCircle size={12}/> {errors[name]}
        </span>
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
            
            {mode === 'register' && (
              <>
                {renderInput("first_name", "Nombre personal", "text", User)}
                {renderInput("username", "Nombre de usuario", "text", User)}
              </>
            )}
            
            {renderInput("email", "Correo electrónico", "email", Mail)}
            {renderInput("password", "Contraseña", showPassword ? "text" : "password", Lock)}

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
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
