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

  // 🔴 VALIDACIÓN EXTRA (CLAVE)
  if (!form.email || !form.password) {
    alert("Todos los campos son obligatorios");
    return;
  }

  if (Object.values(errors).some((e) => e !== "")) {
    alert("Corrige los errores");
    return;
  }

  try {
    setLoading(true);

    console.log("ENVIANDO:", form);

    const res = await loginUser(form);

    console.log("RESPUESTA:", res);

    // 🔴 VALIDACIÓN SEGURA
    if (!res || !res.data) {
      throw new Error("Respuesta inválida del servidor");
    }

    // ✅ GUARDAR TOKEN
    localStorage.setItem("token", res.data.token);

    // ✅ GUARDAR USER EN STORE (MEJORADO)
    login({
      user: res.data.user,
      token: res.data.token,
    });

    setSuccess(true);

    setTimeout(() => {
      navigate("/");
    }, 1200);

  } catch (error) {
    console.log("ERROR COMPLETO:", error);
    console.log("DATA:", error.response?.data);

    alert(
      error.response?.data?.message ||
      JSON.stringify(error.response?.data?.errors) ||
      "Error al iniciar sesión"
    );

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