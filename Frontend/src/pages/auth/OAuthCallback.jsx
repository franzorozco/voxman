import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import api from "../../api/client";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken, fetchUser } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      // Leer el token de la URL: /auth/callback?token=...
      const params = new URLSearchParams(location.search);
      const token = params.get("token");
      const error = params.get("error");

      if (error) {
        toast.error("Error al iniciar sesión con Google");
        navigate("/login", { replace: true });
        return;
      }

      if (token) {
        try {
          // Guardar el token
          setToken(token);
          
          // Establecer el header para axios y pedir los datos del usuario
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          
          const res = await api.get("/v1/admin/me");
          
          useAuthStore.getState().login({ user: res.data.user, token });
          
          toast.success("¡Bienvenido!");
          navigate("/dashboard/home", { replace: true });
        } catch (err) {
          toast.error("Error al obtener la información del usuario");
          navigate("/login", { replace: true });
        }
      } else {
        navigate("/login", { replace: true });
      }
    };

    handleCallback();
  }, [location, navigate, setToken]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ marginBottom: '10px' }}>Iniciando sesión...</h3>
        <p style={{ color: 'var(--text-muted)' }}>Conectando con Google</p>
      </div>
    </div>
  );
}
