import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../api/admin/auth";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await loginUser(form);
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
              <span className="error"><AlertCircle size={14}/> {errors.email}</span>
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
              <span className="error"><AlertCircle size={14}/> {errors.password}</span>
            )}

            <button type="submit" className={`auth-btn-primary ${loading ? "loading" : ""}`}>
              {loading ? "Ingresando..." : "Ingresar"}
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