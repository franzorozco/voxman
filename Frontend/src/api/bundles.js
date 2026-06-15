import api from "./client";

const BASE_URL = "/v1/admin/bundles";

export const getBundles = (params) => 
  api.get(BASE_URL, { params });

export const getBundle = (id) => 
  api.get(`${BASE_URL}/${id}`);

export const createBundle = (data) => 
  api.post(BASE_URL, data);

export const updateBundle = (id, data) => {
  if (data instanceof FormData) {
    data.append("_method", "PUT");
    return api.post(`${BASE_URL}/${id}`, data);
  }
  return api.put(`${BASE_URL}/${id}`, data);
};

export const deleteBundle = (id) => 
  api.delete(`${BASE_URL}/${id}`);
