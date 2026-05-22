import api from "./client";

const BASE_URL = "/v1/admin/products";

export const getProducts = (params) =>
  api.get(BASE_URL, { params });

export const getProduct = (id) =>
  api.get(`${BASE_URL}/${id}`);

export const getRelatedProducts = (id) =>
  api.get(`${BASE_URL}/${id}/related`);

export const createProduct = (data) =>
  api.post(BASE_URL, data);

export const updateProduct = (id, data) => {
  data.append("_method", "PUT");

  return api.post(`${BASE_URL}/${id}`, data);
};

export const deleteProduct = (id) =>
  api.delete(`${BASE_URL}/${id}`);