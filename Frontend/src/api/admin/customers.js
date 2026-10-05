import api from "../client";

const BASE_URL = "/v1/admin/customers";

export const getCustomers = (params) => 
    api.get(BASE_URL, { params: params });

export const getCustomerById = (id) => 
    api.get(`${BASE_URL}/${id}`);

export const createCustomer = (data) => 
    api.post(BASE_URL, data);

export const updateCustomer = (id, data) => 
    api.put(`${BASE_URL}/${id}`, data);

export const deleteCustomer = (id) => 
    api.delete(`${BASE_URL}/${id}`);

export const getDeletedCustomers = (params) => 
    api.get(`${BASE_URL}/deleted`, { params });

export const restoreCustomer = (id) => 
    api.post(`${BASE_URL}/${id}/restore`);

export const searchUnlinkedUsers = (query) => 
    api.get(`${BASE_URL}/search-unlinked-users`, { params: { q: query } });

export const searchPosCustomers = (query) => 
    api.get(`${BASE_URL}/search-pos-customers`, { params: { q: query } });

export const linkUserToCustomer = (data) => 
    api.post(`${BASE_URL}/link-user`, data);

export const getCustomerKpis = () => 
    api.get(`${BASE_URL}/kpis`);

export const updateCustomerTags = (id, tags) => 
    api.put(`${BASE_URL}/${id}/tags`, { tags });

export const adjustCustomerPoints = (id, data) => 
    api.post(`${BASE_URL}/${id}/points`, data);

export const getCustomerTimeline = (id) => 
    api.get(`${BASE_URL}/${id}/timeline`);
