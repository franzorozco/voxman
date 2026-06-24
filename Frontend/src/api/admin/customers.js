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
