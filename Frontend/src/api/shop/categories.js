import api from "../client";

const BASE_URL = "/v1/shop/categories";

export const getCategories = () => api.get(BASE_URL);
