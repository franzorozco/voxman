// services/sizes.js

import api from "./client";

const BASE_URL = "/v1/admin/sizes";

export const getSizes = () =>
  api.get(BASE_URL);

export const getSize = (id) =>
  api.get(`${BASE_URL}/${id}`);

export const createSize = (data) =>
  api.post(BASE_URL, data);

export const updateSize = (id, data) =>
  api.put(`${BASE_URL}/${id}`, data);

export const deleteSize = (id) =>
  api.delete(`${BASE_URL}/${id}`);