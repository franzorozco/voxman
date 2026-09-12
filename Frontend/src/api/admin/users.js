import api from "../client";

const BASE_URL = "/v1/admin/users";

export const getUsers = () => api.get(BASE_URL);

export const getUser = (id) =>
  api.get(`${BASE_URL}/${id}`);

export const createUser = (data) =>
  api.post(BASE_URL, data);

export const updateUser = (id, data) =>
  api.put(`${BASE_URL}/${id}`, data);

export const deleteUser = (id) =>
  api.delete(`${BASE_URL}/${id}`);

export const restoreUser = (id) =>
  api.post(`${BASE_URL}/${id}/restore`);

export const getDeletedUsers = () =>
  api.get(`${BASE_URL}/deleted`);

export const forceDeleteUser = (id) =>
  api.delete(`${BASE_URL}/${id}/force`);

export const generateUserPdf = (id) =>
  api.get(`${BASE_URL}/${id}/pdf`, { responseType: "blob" });