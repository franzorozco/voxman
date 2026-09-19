import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../api/admin/auth";
import toast from "react-hot-toast";
import "./Auth.css"; 

import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import fondo from "../../assets/global/fondos/premium_fashion_bg.png";

export default function ResetPassword() {
  const navigate = useNavigate();
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
    if (name === "password" && value.length < 6) {
      error = "Mínimo 6 caracteres";
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

  return (
    <div className="register-page" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="overlay"></div>

      <div className="register-card">
        <h2>VOXMAN</h2>
        <p className="subtitle">Nueva contraseña</p>

        {success ? (
          <div className="success-message" style={{ textAlign: 'center' }}>
            <CheckCircle size={48} color="#33d9b2" style={{ margin: '0 auto 16px' }} />
            <span style={{ display: 'block', marginBottom: '8px' }}>¡Contraseña actualizada!</span>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Serás redirigido al inicio de sesión.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
              Crea una nueva contraseña para tu cuenta <strong>{form.email}</strong>.
            </p>

            <div className="password-group">
              <div className="input-group" style={{ marginBottom: 16 }}>
                <Lock size={18} className="input-icon" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nueva contraseña"
                  value={form.password}
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
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px', marginTop: '-8px', marginBottom: '12px', paddingLeft: '4px' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }}/>
                  <span>{errors.password}</span>
                </div>
              )}

              <div className="input-group" style={{ marginBottom: 16 }}>
                <Lock size={18} className="input-icon" />
                <input
                  name="password_confirmation"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirmar contraseña"
                  value={form.password_confirmation}
                  onChange={handleChange}
                />
              </div>
              {errors.password_confirmation && (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px', marginTop: '-8px', marginBottom: '12px', paddingLeft: '4px' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }}/>
                  <span>{errors.password_confirmation}</span>
                </div>
              )}
            </div>

            <button type="submit" className={`auth-btn-primary ${loading ? "loading" : ""}`}>
              {loading ? "Actualizando..." : "Restablecer contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
