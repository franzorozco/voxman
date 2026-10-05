import api from "../client";

const BASE_URL = '/v1/admin/supplier-returns';

export const createSupplierReturn = async (data) => {
    return api.post(BASE_URL, data);
};

export const getSupplierReturns = async () => {
    return api.get(BASE_URL);
};
