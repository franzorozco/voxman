import api from "../client";

export const registerUser = (data) => api.post("/register", data);

export const loginUser = (data) => api.post("/login", data);
export const forgotPassword = (data) => api.post("/forgot-password", data);
export const resetPassword = (data) => api.post("/reset-password", data);
export const getGoogleAuthUrl = (origin = 'login') => api.get(`/auth/google?origin=${encodeURIComponent(origin)}`);
export const exchangeGoogleCode = (code) => api.post("/auth/google/exchange", { code });
export const completeGoogleRegistration = (data) => api.post("/auth/google/complete-registration", data);
