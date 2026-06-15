export const createSale = (data) => api.post("/sales", data);
export const getSales = () => api.get("/sales");