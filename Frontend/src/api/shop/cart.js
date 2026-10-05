import api from "../client";

const BASE_URL = "/v1/shop/cart";

export const getCart = () => api.get(BASE_URL);

export const addToCart = (data) => api.post(`${BASE_URL}/add`, data);

export const updateCartItem = (data) => api.put(`${BASE_URL}/update`, data);

export const removeCartItem = (data) => api.delete(`${BASE_URL}/remove`, { data });

export const addBundleToCart = (data) => api.post(`${BASE_URL}/add-bundle`, data);
