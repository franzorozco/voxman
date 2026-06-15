import api from "../client";

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

export const updatePartialProduct = (id, data) => {
  data.append("_method", "PATCH");
  return api.post(`${BASE_URL}/${id}/partial`, data);
};

export const deleteProduct = (id) =>
  api.delete(`${BASE_URL}/${id}`);

export const restoreProduct = (id) =>
  api.post(`${BASE_URL}/${id}/restore`);

export const forceDeleteProduct = (id) =>
  api.delete(`${BASE_URL}/${id}/force`);

export const updateProductImages = (id, data) =>
  api.post(`${BASE_URL}/${id}/images`, data);

export const updateProductMeasurements = (id, measurements) =>
  api.post(`${BASE_URL}/${id}/measurements`, { measurements });

export const getDeletedVariants = () =>
  api.get(`/v1/admin/variants/deleted`);