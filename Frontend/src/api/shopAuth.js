import api from "./client";

export const loginShopUser = (data) => api.post("/login", data);
export const registerShopUser = (data) => api.post("/register", data);
export const getShopProfile = () => api.get("/v1/shop/profile");
export const updateCustomerProfile = (data) => api.post("/v1/shop/customer-profile", data);
export const addDeliveryAddress = (data) => api.post("/v1/shop/delivery-options/add-address", data);
export const initAuthCheckout = (data) => api.post("/v1/shop/checkout/auth-init", data);

export const getDeliveryBranches = () => api.get("/v1/shop/delivery-options/branches");
export const getDeliveryZones = () => api.get("/v1/shop/delivery-options/zones");
