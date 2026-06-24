import axios from "axios";
import { API_URL } from "../config/api";
import { usePosStore } from "../store/usePosStore";

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

  return config;
});

export default api;