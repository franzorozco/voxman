import { useState } from "react";
import { registerUser } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import "./Register.css";
import { useNavigate } from "react-router-dom";
import fondo from "../../assets/global/fondos/fondo_grafito.png";

export default function Register() {
  const { login } = useAuthStore();

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    first_name: "",
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState("");

  // VALIDACIONES
  const validate = (name, value) => {
    let error = "";

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) error = "Correo inválido";
    }

    if (name === "username") {
      const userRegex = /^[a-zA-Z0-9_]+$/;
      if (!userRegex.test(value)) {
        error = "Solo letras, números y _ (sin espacios)";
      }
    }

    if (name === "first_name") {
      if (value.length < 2) {
        error = "Debe tener al menos 2 caracteres";
      }
    }

if (name === "password") {
  let strength = "Débil";

  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  if (value.length >= 6) strength = "Media";

  if (
    value.length >= 8 &&
    hasUpper &&
    hasNumber &&
    hasSymbol
  ) {
    strength = "Fuerte";
  }

  setPasswordStrength(strength);

  if (value.length < 6) {
    error = "Mínimo 6 caracteres";
  }
}

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });

    validate(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.values(errors).some((e) => e !== "")) {
      alert("Corrige los errores");
      return;
    }

    try {
        setLoading(true);

        const res = await registerUser(form);

        // 🔥 IMPORTANTE: solo éxito si hay respuesta real
        if (res && res.data) {

          setSuccess(true); // 🔥 activa vista de éxito

          setTimeout(() => {
            navigate("/login");
          }, 1200); // 1.2 segundos

        }

      } catch (error) {
        alert(error.response?.data?.message || "Error en registro");
      } finally {
        setLoading(false);
      }
  };

  return (
    <div
      className="register-page"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <div className="overlay"></div>

      <div className="register-card">
        <h2>VOXMAN</h2>
        <p className="subtitle">Únete al estilo</p>

        {success ? (
            <div className="success-message">
              Usuario registrado
            </div>
          ) : (
        <form onSubmit={handleSubmit}>
          {/* EMAIL */}
          <input
            name="email"
            placeholder="Correo electrónico"
            onChange={handleChange}
          />
          {errors.email && <span className="error">{errors.email}</span>}

          {/* USERNAME */}
          <input
            name="username"
            placeholder="Nombre de la cuenta"
            onChange={handleChange}
          />
          {errors.username && <span className="error">{errors.username}</span>}

          {/* NOMBRE */}
          <input
            name="first_name"
            placeholder="Nombre personal"
            onChange={handleChange}
          />
          {errors.first_name && (
            <span className="error">{errors.first_name}</span>
          )}

          {/* PASSWORD */}
          <div className="password-group">

            <input
              name="password"
              type="password"
              placeholder="Contraseña"
              onChange={handleChange}
            />

            {/* BARRA DE SEGURIDAD */}
            <div className="password-strength-bar">
              <div
                className={`strength-fill ${passwordStrength.toLowerCase()}`}
              ></div>
            </div>

            <div className={`strength-text ${passwordStrength.toLowerCase()}`}>
              Seguridad: {passwordStrength || "—"}
            </div>

          </div>

          {errors.password && (
            <span className="error">{errors.password}</span>
          )}

          <button type="submit" className={loading ? "loading" : ""}>
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>
        )}
        
      </div>
    </div>
  );
}