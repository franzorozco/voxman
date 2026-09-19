import api from "../client";

const BASE_URL = "/v1/admin/categories";

export const getCategories = () =>
  api.get(BASE_URL);

export const getCategory = (id) =>
  api.get(`${BASE_URL}/${id}`);

export const createCategory = (data) =>
  api.post(BASE_URL, data);

export const updateCategory = (id, data) =>
  api.put(`${BASE_URL}/${id}`, data);

export const deleteCategory = (id) =>
  api.delete(`${BASE_URL}/${id}`);
