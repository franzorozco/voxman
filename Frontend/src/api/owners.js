import api from "./client";

const BASE_URL = "/v1/admin/owners";

export const getOwners = () =>
  api.get(BASE_URL);

export const getOwner = (id) =>
  api.get(`${BASE_URL}/${id}`);

export const createOwner = (data) =>
  api.post(BASE_URL, data);

export const updateOwner = (id, data) =>
  api.put(`${BASE_URL}/${id}`, data);

export const deleteOwner = (id) =>
  api.delete(`${BASE_URL}/${id}`);
