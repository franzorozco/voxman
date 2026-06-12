import api from "./client";

const BASE_URL = "/v1/admin/brands";

export const getBrands = () => api.get(BASE_URL);

export const getBrand = (id) => api.get(`${BASE_URL}/${id}`);

export const createBrand = (data) => api.post(BASE_URL, data);

export const updateBrand = (id, data) => api.put(`${BASE_URL}/${id}`, data);

export const deleteBrand = (id) => api.delete(`${BASE_URL}/${id}`);
