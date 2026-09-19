// services/attributeValues.js

import api from "../client";

const BASE_URL = "/v1/admin/attribute-values";

export const getAttributeValues = () =>
  api.get(BASE_URL);

export const getAttributeValue = (id) =>
  api.get(`${BASE_URL}/${id}`);

export const createAttributeValue = (data) =>
  api.post(BASE_URL, data);


export const updateAttributeValue = (id, data) =>
  api.put(`${BASE_URL}/${id}`, data);

export const deleteAttributeValue = (id) =>
  api.delete(`${BASE_URL}/${id}`);