import { useState } from "react";
import { registerUser } from "../../api/admin/auth";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import "./Auth.css";
import { useNavigate, Link } from "react-router-dom";
import fondo from "../../assets/global/fondos/premium_fashion_bg.png";
import { Mail, Lock, User, UserCheck, Eye, EyeOff, AlertCircle, CheckCircle, ShieldAlert, Shield, ShieldCheck } from "lucide-react";

export default function Register() {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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
      if (value.length < 6) {
        error = "Mínimo 6 caracteres";
      } else {
        const hasNumbers = /\d/.test(value);
        const hasLetters = /[a-zA-Z]/.test(value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

        if (hasLetters && hasNumbers && hasSpecial && value.length >= 8) {
          setPasswordStrength("Fuerte");
        } else if ((hasLetters && hasNumbers) || (hasLetters && hasSpecial)) {
          setPasswordStrength("Media");
        } else {
          setPasswordStrength("Débil");
        }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acceptedTerms) {
      toast.error("Debes aceptar los términos y condiciones");
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

  return (
    <div className="register-page" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="overlay"></div>

      <div className="register-card">
        <h2>VOXMAN</h2>
        <p className="subtitle">Únete al estilo</p>

        {success ? (
          <div className="success-message">
            <CheckCircle size={48} color="#33d9b2" />
            <span>Usuario registrado</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            
            {/* EMAIL */}
            <div className="input-group">
              <Mail size={18} className="input-icon" />
              <input
                name="email"
                placeholder="Correo electrónico"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            {errors.email && (
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px', marginTop: '-8px', marginBottom: '12px', paddingLeft: '4px' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }}/>
                <span>{errors.email}</span>
              </div>
            )}

            {/* USERNAME */}
            <div className="input-group">
              <User size={18} className="input-icon" />
              <input
                name="username"
                placeholder="Nombre de la cuenta"
                value={form.username}
                onChange={handleChange}
              />
            </div>
            {errors.username && (
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px', marginTop: '-8px', marginBottom: '12px', paddingLeft: '4px' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }}/>
                <span>{errors.username}</span>
              </div>
            )}

            {/* PASSWORD */}
            <div className="password-group">
              <div className="input-group" style={{ marginBottom: 8 }}>
                <Lock size={18} className="input-icon" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  onChange={handleChange}
                />
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
              <div className="password-strength-container">
                <div className="password-strength-bar-wrapper">
                  <div className={`strength-fill ${passwordStrength.toLowerCase()}`}></div>
                </div>
                <div className={`strength-text ${passwordStrength.toLowerCase()}`}>
                  {renderStrengthIcon()} {passwordStrength || "—"}
                </div>
              </div>
            </div>

            {errors.password && (
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px', marginTop: '-8px', marginBottom: '12px', paddingLeft: '4px' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }}/>
                <span>{errors.password}</span>
              </div>
            )}

            {/* CONFIRM PASSWORD */}
            <div className="input-group" style={{ marginTop: '16px' }}>
              <Lock size={18} className="input-icon" />
              <input
                name="password_confirmation"
                type={showPassword ? "text" : "password"}
                placeholder="Confirmar contraseña"
                onChange={handleChange}
              />
            </div>
            {errors.password_confirmation && (
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px', marginTop: '-8px', marginBottom: '12px', paddingLeft: '4px' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }}/>
                <span>{errors.password_confirmation}</span>
              </div>
            )}

            {/* TERMS AND CONDITIONS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: '16px' }}>
              <input 
                type="checkbox" 
                id="terms" 
                checked={acceptedTerms} 
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
              />
              <label htmlFor="terms" style={{ fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer' }}>
                Acepto los <span style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }}>Términos y Condiciones</span>
              </label>
            </div>

            <button type="submit" className={`auth-btn-primary ${loading ? "loading" : ""}`}>
              {loading ? "Creando..." : "Crear cuenta"}
            </button>

            <div className="auth-footer">
              ¿Ya tienes cuenta?
              <Link to="/login" className="auth-link">Inicia sesión</Link>
            </div>
          </form>
        )}
      </div>

      {/* TERMS MODAL */}
      {showTermsModal && (
        <div className="modal-overlay fade-in" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%', background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
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