// services/productTypeMeasurements.js

import api from "../client";

const BASE_URL = "/v1/admin/product-type-measurements";

export const getProductTypeMeasurements = () =>
  api.get(BASE_URL);

export const getProductTypeMeasurement = (id) =>
  api.get(`${BASE_URL}/${id}`);

export const createProductTypeMeasurement = (data) =>
  api.post(BASE_URL, data);

export const updateProductTypeMeasurement = (id, data) =>
  api.put(`${BASE_URL}/${id}`, data);

export const deleteProductTypeMeasurement = (id) =>
  api.delete(`${BASE_URL}/${id}`);