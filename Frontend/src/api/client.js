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
    if (error.response && error.response.status === 401) {
      // 1. Limpiar estado de autenticación (Zustand)
      // Importamos dinámicamente para evitar ciclos o usamos el local storage directo
      // Pero mejor cargar el store
      import("../store/authStore").then((module) => {
        const logout = module.useAuthStore.getState().logout;
        if (logout) logout();
        
        // 2. Solo redirigir si no estamos ya en /login
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      });
    }
    return Promise.reject(error);
  }
);

export default api;