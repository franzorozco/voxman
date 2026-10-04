import api from "../client";

const BASE_URL = "/v1/admin/product-types";

export const getProductTypes = () =>
  api.get(BASE_URL);

export const getProductType = (id) =>
  api.get(`${BASE_URL}/${id}`);

export const createProductType = (data) =>
  api.post(BASE_URL, data);

export const updateProductType = (id, data) =>
  api.put(`${BASE_URL}/${id}`, data);

export const deleteProductType = (id) =>
  api.delete(`${BASE_URL}/${id}`);
