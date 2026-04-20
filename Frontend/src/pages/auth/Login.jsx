import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import "./Register.css"; // reutilizamos estilos

import fondo from "../../assets/global/fondos/fondo_grafito.png";

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

    setForm({
      ...form,
      [name]: value,
    });

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

    // 🔥 GUARDAR EN LOCALSTORAGE (ESTO TE FALTA)
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    login({ user, token });

    setSuccess(true);

    setTimeout(() => navigate("/"), 1200);

  } catch (error) {
    console.log(error.response?.data || error.message);
    alert(error.response?.data?.message || "Error al iniciar sesión");
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
        <p className="subtitle">Bienvenido de vuelta</p>

        {success ? (
          <div className="success-message">
            Inicio exitoso ✔
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

            {/* PASSWORD */}
            <input
              name="password"
              type="password"
              placeholder="Contraseña"
              onChange={handleChange}
            />

            {errors.password && (
              <span className="error">{errors.password}</span>
            )}

            <button type="submit" className={loading ? "loading" : ""}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

          </form>
        )}
      </div>
    </div>
  );
}