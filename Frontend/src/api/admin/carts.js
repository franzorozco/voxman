import api from '../client';

const BASE_URL = '/v1/admin/carts';

export const getCarts = (params) => 
  api.get(BASE_URL, { params });

export const getCartDetails = (id) => 
  api.get(`${BASE_URL}/${id}`);

export const createCart = (data) => 
  api.post(BASE_URL, data);

export const updateCart = (id, data) => 
  api.put(`${BASE_URL}/${id}`, data);

export const convertCartToSale = (id) => {
  return api.post(`${BASE_URL}/${id}/convert`);
};

export const sendCartReminder = (id) => {
  return api.post(`${BASE_URL}/${id}/reminder`);
};

export const deleteCart = (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

export const convertCartToOrder = (id) => {
  return api.post('/v1/admin/order-network/convert-draft', { cart_id: id });
};
