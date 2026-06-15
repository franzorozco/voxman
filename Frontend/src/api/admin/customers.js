import api from "../client";

const BASE_URL = "/v1/admin/customers";

export const getCustomers = (params) => api.get(BASE_URL, { params });
