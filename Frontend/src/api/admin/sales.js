import api from "../client";

const BASE_URL = "/v1/admin/sales";

export const getSales = (params = {}) => {
  return api.get(BASE_URL, { params });
};

export const getSale = (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

export const updateSaleStatus = (id, data) => {
  return api.put(`${BASE_URL}/${id}`, data);
};

export const cancelSale = (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};