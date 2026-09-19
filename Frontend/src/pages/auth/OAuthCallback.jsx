import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import api from "../../api/client";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      // Leer el token de la URL: /auth/callback?token=...
      const params = new URLSearchParams(location.search);
      const token = params.get("token");
      const googleRegToken = params.get("google_reg_token");
      const origin = params.get("origin");
      const email = params.get("email") || "";
      const name = params.get("name") || "";
      const error = params.get("error");

      if (error) {
        toast.error("Error al iniciar sesión con Google");
        navigate("/login", { replace: true });
        return;
      }

      if (googleRegToken) {
        // Redirigir según el origen
        if (origin === 'shop') {
          navigate(`/shop?google_reg_token=${googleRegToken}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`, { replace: true });
        } else {
          navigate(`/register?google_reg_token=${googleRegToken}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`, { replace: true });
        }
        return;
      }

      if (token) {
        try {
          // Guardar el token localmente para el interceptor
          localStorage.setItem("token", token);
          if (origin === 'shop') {
            localStorage.setItem("shop_auth_token", token);
          }
          
          // Establecer el header para axios y pedir los datos del usuario
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          
          const res = await api.get("/v1/admin/me");
          
          if (origin === 'shop') {
            localStorage.setItem("shop_user", JSON.stringify(res.data.user));
          }

          login({ user: res.data.user, token });
          
          toast.success("¡Bienvenido!");
          if (origin === 'shop') {
            navigate("/shop", { replace: true });
          } else {
            navigate("/dashboard/home", { replace: true });
          }
        } catch (err) {
          toast.error("Error al obtener la información del usuario");
          if (origin === 'shop') {
            navigate("/shop", { replace: true });
          } else {
            navigate("/login", { replace: true });
          }
        }
      } else {
        if (origin === 'shop') {
          navigate("/shop", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      }
    };

    handleCallback();
  }, [location, navigate, login]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ marginBottom: '10px' }}>Iniciando sesión...</h3>
        <p style={{ color: 'var(--text-muted)' }}>Conectando con Google</p>
      </div>
    </div>
  );
}
