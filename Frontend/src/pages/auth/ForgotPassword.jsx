import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword } from "../../api/admin/auth";
import toast from "react-hot-toast";
import "./Auth.css"; 

import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import fondo from "../../assets/global/fondos/premium_fashion_bg.png";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Por favor ingresa tu correo");
      return;
    }

    try {
      setLoading(true);
      await forgotPassword({ email });
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al solicitar el enlace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="overlay"></div>

      <div className="register-card">
        <h2>VOXMAN</h2>
        <p className="subtitle">Recuperar contraseÃ±a</p>

        {success ? (
          <div className="success-message" style={{ textAlign: 'center' }}>
            <CheckCircle size={48} color="#33d9b2" style={{ margin: '0 auto 16px' }} />
            <span style={{ display: 'block', marginBottom: '8px' }}>Â¡Solicitud recibida!</span>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
              Si <strong>{email}</strong> estÃ¡ registrado, recibirÃ¡s un enlace para restablecer tu contraseÃ±a. Revisa tu bandeja de entrada o carpeta de spam.
            </p>
            <button 
              className="auth-btn-primary" 
              onClick={() => navigate('/login')}
              style={{ marginTop: '20px' }}
            >
              Volver al Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5', textAlign: 'center' }}>
              Ingresa el correo electrÃ³nico asociado a tu cuenta y te enviaremos un enlace para restablecer tu contraseÃ±a.
            </p>

            <div className="input-group">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                placeholder="Correo electrÃ³nico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && (
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px', marginTop: '-8px', marginBottom: '12px', paddingLeft: '4px' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }}/>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className={`auth-btn-primary ${loading ? "loading" : ""}`}>
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>

            <div className="auth-footer">
              Â¿Recordaste tu contraseÃ±a?
              <Link to="/login" className="auth-link">Inicia sesiÃ³n</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
