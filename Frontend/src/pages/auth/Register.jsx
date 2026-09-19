import { useState, useEffect } from "react";
import { registerUser, getGoogleAuthUrl } from "../../api/admin/auth";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import "./Auth.css";
import { useNavigate, Link, useLocation } from "react-router-dom";
import fondo from "../../assets/global/fondos/premium_fashion_bg.png";
import { Mail, Lock, User, UserCheck, Eye, EyeOff, AlertCircle, CheckCircle, ShieldAlert, Shield, ShieldCheck, Phone } from "lucide-react";

export default function Register() {
  const { login } = useAuthStore();
  const navigate = useNavigate();

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
            navigate("/dashboard/home");
          }, 1200);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error al completar registro con Google");
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
            <div className={`input-group ${isGoogleReg ? "disabled" : ""}`}>
              <Mail size={18} className="input-icon" />
              <input
                name="email"
                placeholder="Correo electrónico"
                value={form.email}
                onChange={handleChange}
                disabled={isGoogleReg}
              />
            </div>
            {errors.email && !isGoogleReg && (
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

            {isGoogleReg ? (
              <>
                <div className="input-group">
                  <UserCheck size={18} className="input-icon" />
                  <input name="first_name" placeholder="Nombre(s)" value={form.first_name} onChange={handleChange} required />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <input name="last_name_paternal" placeholder="Apellido Paterno" value={form.last_name_paternal} onChange={handleChange} />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <input name="last_name_maternal" placeholder="Apellido Materno" value={form.last_name_maternal} onChange={handleChange} />
                  </div>
                </div>
                <div className="input-group">
                  <Phone size={18} className="input-icon" style={{ padding: 0 }} />
                  <input name="phone" placeholder="Teléfono" value={form.phone} onChange={handleChange} />
                </div>
              </>
            ) : (
              <>
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
              </>
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

            <button type="submit" className={`auth-btn-primary ${loading ? "loading" : ""}`} disabled={!acceptedTerms || loading} style={{ opacity: (!acceptedTerms || loading) ? 0.7 : 1, cursor: (!acceptedTerms || loading) ? 'not-allowed' : 'pointer' }}>
              {loading ? (isGoogleReg ? "Completando..." : "Creando...") : (isGoogleReg ? "Completar Registro" : "Crear cuenta")}
            </button>

            {!isGoogleReg && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
                  <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
                  <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '12px' }}>O REGÍSTRATE CON</span>
                  <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
                </div>

                <button 
                  type="button" 
                  onClick={handleGoogleLogin} 
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
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
              </>
            )}

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