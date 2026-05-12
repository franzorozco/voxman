// services/attributes.js

import api from "./client";

const BASE_URL = "/v1/admin/attributes";

export const getAttributes = () =>
  api.get(BASE_URL);

export const getAttribute = (id) =>
  api.get(`${BASE_URL}/${id}`);

export const createAttribute = (data) =>
  api.post(BASE_URL, data);

export const updateAttribute = (id, data) =>
  api.put(`${BASE_URL}/${id}`, data);

export const deleteAttribute = (id) =>
  api.delete(`${BASE_URL}/${id}`);