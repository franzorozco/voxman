import api from "../client";

const BASE_URL = "/v1/shop/products";

export const getProducts = (params) => 
    api.get(BASE_URL, { params });

export const getProduct = (slugOrId) => 
    api.get(`${BASE_URL}/${slugOrId}`);
