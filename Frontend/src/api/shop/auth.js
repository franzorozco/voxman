import api from "../client";

const BASE_URL = "/v1/shop";

export const login = (data) => api.post(`${BASE_URL}/login`, data);

export const register = (data) => api.post(`${BASE_URL}/register`, data);

export const getProfile = () => api.get(`${BASE_URL}/profile`);

export const logout = () => api.post(`${BASE_URL}/logout`);
