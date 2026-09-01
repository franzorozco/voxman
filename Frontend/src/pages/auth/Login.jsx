import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, getGoogleAuthUrl } from "../../api/admin/auth";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import "./Auth.css"; 

import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import fondo from "../../assets/global/fondos/premium_fashion_bg.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

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
      if (value.length < 6) {
        error = "Mínimo 6 caracteres";
      }
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
      console.log(error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="overlay"></div>

      <div className="register-card">
        <h2>VOXMAN</h2>
        <p className="subtitle">Bienvenido de vuelta</p>

        {success ? (
          <div className="success-message">
            <CheckCircle size={48} color="#33d9b2" />
            <span>Inicio exitoso</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            
            {/* EMAIL */}
            <div className="input-group">
              <Mail size={18} className="input-icon" />
              <input
                name="email"
                placeholder="Correo electrónico"
                onChange={handleChange}
              />
            </div>
            {errors.email && (
              <div className="error" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} /> 
                <span>{errors.email}</span>
              </div>
            )}

            {/* PASSWORD */}
            <div className="input-group">
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
            {errors.password && (
              <div className="error" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} /> 
                <span>{errors.password}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="remember" 
                  checked={remember} 
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                />
                <label htmlFor="remember" style={{ fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer' }}>
                  Recordarme
                </label>
              </div>
              <Link to="/forgot-password" style={{ color: 'var(--color-primary)', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button type="submit" className={`auth-btn-primary ${loading ? "loading" : ""}`}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
              <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '12px' }}>O INICIA CON</span>
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

            <div className="auth-footer">
              ¿No tienes una cuenta?
              <Link to="/register" className="auth-link">Únete al estilo</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}