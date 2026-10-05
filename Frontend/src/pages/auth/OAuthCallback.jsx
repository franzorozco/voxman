import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import api from "../../api/client";
import { exchangeGoogleCode } from "../../api/admin/auth";

// Mensajes para los errores que devuelve el backend en /login?error=...
const ERROR_MESSAGES = {
  email_not_verified: "Tu correo de Google no estÃ¡ verificado.",
  account_disabled: "Tu cuenta estÃ¡ desactivada. Contacta a soporte.",
  invalid_state: "La sesiÃ³n de Google expirÃ³. IntÃ©ntalo de nuevo.",
};

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  // React StrictMode ejecuta los efectos 2 veces; el cÃ³digo es de un solo uso, asÃ­ que solo se canjea una vez
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const handleCallback = async () => {
      // ðŸ”’ La URL ya no trae el token de sesiÃ³n, solo un cÃ³digo de un solo uso (60 s).
      // Se borra de la barra de direcciones/historial de inmediato.
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const error = params.get("error");
      window.history.replaceState({}, "", "/auth/callback");

      if (error) {
        toast.error(ERROR_MESSAGES[error] || "Error al iniciar sesiÃ³n con Google");
        navigate("/login", { replace: true });
        return;
      }

      if (!code) {
        navigate("/login", { replace: true });
        return;
      }

      let data;
      try {
        const res = await exchangeGoogleCode(code);
        data = res.data;
      } catch (err) {
        toast.error(err.response?.data?.message || "Error al iniciar sesiÃ³n con Google");
        navigate("/login", { replace: true });
        return;
      }

      const origin = data.origin === "shop" ? "shop" : "login";

      // Usuario nuevo: completar registro
      if (data.type === "register" && data.google_reg_token) {
        const qs = `google_reg_token=${encodeURIComponent(data.google_reg_token)}&email=${encodeURIComponent(data.email || "")}&name=${encodeURIComponent(data.name || "")}`;
        navigate(origin === "shop" ? `/shop?${qs}` : `/register?${qs}`, { replace: true });
        return;
      }

      // Usuario existente: iniciar sesiÃ³n
      if (data.type === "login" && data.token) {
        const token = data.token;
        try {
          localStorage.setItem("token", token);
          if (origin === "shop") {
            localStorage.setItem("shop_auth_token", token);
          }

          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const res = await api.get("/v1/admin/me");

          if (origin === "shop") {
            localStorage.setItem("shop_user", JSON.stringify(res.data.user));
          }

          login({ user: res.data.user, token });

          toast.success("Â¡Bienvenido!");
          navigate(origin === "shop" ? "/shop" : "/dashboard/home", { replace: true });
        } catch (err) {
          toast.error("Error al obtener la informaciÃ³n del usuario");
          navigate(origin === "shop" ? "/shop" : "/login", { replace: true });
        }
        return;
      }

      navigate(origin === "shop" ? "/shop" : "/login", { replace: true });
    };

    handleCallback();
  }, [location, navigate, login]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ marginBottom: '10px' }}>Iniciando sesiÃ³n...</h3>
        <p style={{ color: 'var(--text-muted)' }}>Conectando con Google</p>
      </div>
    </div>
  );
}
