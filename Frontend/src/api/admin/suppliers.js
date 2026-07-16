import api from "../client";

const BASE_URL = "v1/admin/suppliers";

export const getSuppliers = (search = "") => 
    api.get(`${BASE_URL}?search=${search}`);
export const getSupplier = (id) => 
    api.get(`${BASE_URL}/${id}`);
export const createSupplier = (data) => 
    api.post(BASE_URL, data);
export const updateSupplier = (id, data) => 
    api.put(`${BASE_URL}/${id}`, data);
export const deleteSupplier = (id) => 
    api.delete(`${BASE_URL}/${id}`);

export const getDeletedSuppliers = () => 
    api.get(`${BASE_URL}/deleted`);
export const restoreSupplier = (id) => 
    api.put(`${BASE_URL}/${id}/restore`);
export const forceDeleteSupplier = (id) => 
    api.delete(`${BASE_URL}/${id}/force`);

export const getSupplierStats = () =>
    api.get(`${BASE_URL}/stats`);
export const getSupplierProfile = (id) =>
    api.get(`${BASE_URL}/${id}/profile`);
