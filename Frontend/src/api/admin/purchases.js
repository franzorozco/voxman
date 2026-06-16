import api from "../client";

const BASE_URL = "v1/admin/purchases";

export const getPurchases = (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.status) query.append("status", params.status);
  
  return api.get(`${BASE_URL}?${query.toString()}`);
};

export const getPurchase = (id) => 
  api.get(`${BASE_URL}/${id}`);
export const createPurchase = (data) => 
  api.post(BASE_URL, data);
export const cancelPurchase = (id) => 
  api.put(`${BASE_URL}/${id}/cancel`);
export const receivePurchase = (data) => 
  api.post(`${BASE_URL}/reception`, data);
