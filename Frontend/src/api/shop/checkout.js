import api from "../client";

const BASE_URL = "/v1/shop/cart/checkout";

export const processCheckout = (data) => api.post(BASE_URL, data);
