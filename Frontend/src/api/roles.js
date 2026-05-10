// src/api/roles.js

import api from "./client";

const BASE_URL = "/v1/admin/roles";

export const getRoles = () =>
  api.get(BASE_URL);

export const getRole = (id) =>
  api.get(`${BASE_URL}/${id}`);

export const createRole = (data) =>
  api.post(BASE_URL, data);

export const updateRole = (id, data) =>
  api.put(`${BASE_URL}/${id}`, data);

export const deleteRole = (id) =>
  api.delete(`${BASE_URL}/${id}`);