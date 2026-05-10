import api from "./client";

// 🔥 CORRECTO según tu Laravel controller:
const BASE_URL = "/v1/admin/products";

// LISTAR
export const getProducts = (params) =>
  api.get(BASE_URL, { params });

// DETALLE
export const getProduct = (id) =>
  api.get(`${BASE_URL}/${id}`);

// RELACIONADOS
export const getRelatedProducts = (id) =>
  api.get(`${BASE_URL}/${id}/related`);

// CREAR
export const createProduct = (data) =>
  api.post(BASE_URL, data);

// ACTUALIZAR
export const updateProduct = (id, data) =>
  api.put(`${BASE_URL}/${id}`, data);

// ELIMINAR
export const deleteProduct = (id) =>
  api.delete(`${BASE_URL}/${id}`);