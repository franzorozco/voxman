import api from "./client";

const BASE_URL = "/v1/products";

export const getProducts = (params) =>
  api.get(BASE_URL, { params });

export const getProduct = (id) =>
  api.get(`${BASE_URL}/${id}`);

export const getRelatedProducts = (id) =>
  api.get(`${BASE_URL}/${id}/related`);