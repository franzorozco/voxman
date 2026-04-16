import api from "./client";

export const getProducts = () => api.get("/products");
export const createProduct = (data) => api.post("/products", data);
export const getProduct = (id) => api.get(`/products/${id}`);