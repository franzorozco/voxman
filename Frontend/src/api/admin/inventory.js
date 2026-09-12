// src/api/inventory.js

import api from "../client";

const BASE_URL = "/v1/admin/inventories";

export const getInventory = (params = {}) =>
  api.get(BASE_URL, { params });

export const getMovements = (params = {}) =>
  api.get(`${BASE_URL}/movements`, { params });

export const adjustStock = (data) =>
  api.post(`${BASE_URL}/adjust`, data);

export const batchAdjustStock = (data) =>
  api.post(`${BASE_URL}/batch-adjust`, data);

export const transferStock = (data) =>
  api.post(`${BASE_URL}/transfer`, data);

export const getInventoryStats = (params = {}) =>
  api.get(`${BASE_URL}/stats`, { params });

export const submitInventoryAudit = (data) =>
  api.post(`${BASE_URL}/audit`, data);
