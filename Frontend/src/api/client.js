import axios from "axios";
import { API_URL } from "../config/api";
import { usePosStore } from "../store/pos/usePosStore";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  config.headers = config.headers ?? {};
  config.headers.Accept = "application/json";

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const posBranchId = usePosStore.getState().branchId;
  
  if (posBranchId) {
    config.headers['X-Branch-Id'] = posBranchId;
  }

  // SHOP SPECIFIC TOKENS
  if (config.url && config.url.includes('/v1/shop')) {
    const shopCartToken = localStorage.getItem('shop_cart_token');
    if (shopCartToken) {
      config.headers['X-Cart-Token'] = shopCartToken;
    }
    
    let shopAuthToken = localStorage.getItem('shop_auth_token');
    if (shopAuthToken === 'undefined' || shopAuthToken === 'null') {
      shopAuthToken = null;
    }
    const finalToken = shopAuthToken || localStorage.getItem('token');
    
    if (finalToken && finalToken !== 'undefined' && finalToken !== 'null') {
      config.headers.Authorization = `Bearer ${finalToken}`;
    }
  }

  return config;
});

// Interceptor global de respuestas para manejar errores 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) {
        // 1. Limpiar estado de autenticación (Zustand)
        import("../store/authStore").then((module) => {
          const logout = module.useAuthStore.getState().logout;
          if (logout) logout();
          
          // 2. Solo redirigir si no estamos ya en /login y NO estamos en la tienda pública
          const currentPath = window.location.pathname;
          if (currentPath !== "/login" && !currentPath.startsWith("/shop")) {
            window.location.href = "/login";
          }
        });
      } else if (status === 500 || status === 501 || status === 503) {
        // Redirigir a la página de error correspondiente
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith("/error/")) {
          window.location.href = `/error/${status}`;
        }
      }
    } else if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      // Importar toast de forma dinámica para no romper inicializaciones
      import("react-hot-toast").then((module) => {
        const toast = module.default || module.toast;
        const currentPath = window.location.pathname;
        // Evitamos mostrar el toast si ya estamos en una página de error total (5xx)
        if (!currentPath.startsWith("/error/")) {
          toast.error("Error de red: No se pudo contactar con el servidor. Revisa tu conexión.", {
             id: 'network-error-toast', // evita toasts duplicados si fallan múltiples peticiones
          });
        }
      });
    }
    return Promise.reject(error);
  }
);

export default api;