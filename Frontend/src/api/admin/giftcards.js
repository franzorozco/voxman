import api from "../client";

const BASE_URL = "/v1/admin/giftcards";

export const getGiftcards = (params) => 
    api.get(BASE_URL, { params });

export const createGiftcard = (data) => 
    api.post(BASE_URL, data);

export const reloadGiftcard = (id, data) => 
    api.post(`${BASE_URL}/${id}/reload`, data);

export const validateGiftcard = (data) => 
    api.post(`${BASE_URL}/validate`, data);

export const digitalizeGiftcard = (data) => 
    api.post(`${BASE_URL}/digitalize`, data);

export const deleteGiftcard = (id) => 
    api.delete(`${BASE_URL}/${id}`);

export const getDeletedGiftcards = () => api.get(`${BASE_URL}/deleted`);

export const restoreGiftcard = (id) => api.put(`${BASE_URL}/${id}/restore`);

export const forceDeleteGiftcard = (id) => api.delete(`${BASE_URL}/${id}/force`);
