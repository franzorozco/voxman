// src/api/roles.js

import api from "./client";

export const getRoles = () => api.get("/roles");
export const getRole = (id) => api.get(`/roles/${id}`);
export const createRole = (data) => api.post("/roles", data);
export const updateRole = (id, data) => api.put(`/roles/${id}`, data);
export const deleteRole = (id) => api.delete(`/roles/${id}`);