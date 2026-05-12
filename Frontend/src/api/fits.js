// services/fits.js

import api from "./client";

const BASE_URL = "/v1/admin/fits";

export const getFits = () =>
  api.get(BASE_URL);

export const getFit = (id) =>
  api.get(`${BASE_URL}/${id}`);

export const createFit = (data) =>
  api.post(BASE_URL, data);

export const updateFit = (id, data) =>
  api.put(`${BASE_URL}/${id}`, data);

export const deleteFit = (id) =>
  api.delete(`${BASE_URL}/${id}`);

export const restoreFit = (id) =>
  api.post(`${BASE_URL}/${id}/restore`);