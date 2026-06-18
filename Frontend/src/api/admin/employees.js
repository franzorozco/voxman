import api from "../client";

const BASE_URL = "/v1/admin/employees";

export const getEmployees = (params) => 
    api.get(BASE_URL, { params: params });

export const getEmployeeById = (id) => 
    api.get(`${BASE_URL}/${id}`);

export const createEmployee = (data) => 
    api.post(BASE_URL, data);

export const updateEmployee = (id, data) => 
    api.put(`${BASE_URL}/${id}`, data);

export const deleteEmployee = (id) => 
    api.delete(`${BASE_URL}/${id}`);

export const getDeletedEmployees = (params) => 
    api.get(`${BASE_URL}/deleted`, { params });

export const restoreEmployee = (id) => 
    api.post(`${BASE_URL}/${id}/restore`);

export const forceDeleteEmployee = (id) => 
    api.delete(`${BASE_URL}/${id}/force`);

export const getEmployeeStats = (id) => 
    api.get(`${BASE_URL}/${id}/stats`);
