import api from "../client";

const BASE_URL = "v1/admin/accounts-payable";

export const getAccountsPayable = (params) => 
  api.get(BASE_URL, { params });

export const getAccountsPayableStats = () => 
  api.get(`${BASE_URL}/stats`);

// El abono a la deuda se hace a través del endpoint de compras que ya creamos en purchases.js:
// export const registerPurchasePayment = (id, data) => api.post(`/purchases/${id}/pay`, data);
