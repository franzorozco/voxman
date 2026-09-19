import api from "../client";

const BASE_URL = "/v1/admin/discounts";

export const getPromotions = () => 
    api.get(BASE_URL);

export const createPromotion = (data) => 
    api.post(BASE_URL, data);

export const updatePromotion = (id, data) => 
    api.put(`${BASE_URL}/${id}`, data);

export const deletePromotion = (id) => 
    api.delete(`${BASE_URL}/${id}`);

export const getDeletedPromotions = () => 
    api.get(`${BASE_URL}/deleted`);

export const restorePromotion = (id) => 
    api.post(`${BASE_URL}/${id}/restore`);

export const forceDeletePromotion = (id) => 
    api.delete(`${BASE_URL}/${id}/force`);
