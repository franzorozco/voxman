// services/measurementTypes.js

import api from "./client";

const BASE_URL = "/v1/admin/measurement-types";

export const getMeasurementTypes = () =>
  api.get(BASE_URL);

export const getMeasurementType = (id) =>
  api.get(`${BASE_URL}/${id}`);

export const createMeasurementType = (data) =>
  api.post(BASE_URL, data);

export const updateMeasurementType = (id, data) =>
  api.put(`${BASE_URL}/${id}`, data);

export const deleteMeasurementType = (id) =>
  api.delete(`${BASE_URL}/${id}`);