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
    
    const shopAuthToken = localStorage.getItem('shop_auth_token');
    if (shopAuthToken) {
      config.headers.Authorization = `Bearer ${shopAuthToken}`;
    }
  }

  return config;
});

export default api;