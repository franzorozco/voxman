import api from "./client";

export const loginShopUser = (data) => api.post("/login", data);
export const registerShopUser = (data) => api.post("/register", data);
export const getShopProfile = () => api.get("/v1/shop/profile");
export const updateCustomerProfile = (data) => api.post("/v1/shop/customer-profile", data);
export const initAuthCheckout = () => api.post("/v1/shop/checkout/auth-init");
