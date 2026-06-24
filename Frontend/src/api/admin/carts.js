import api from '../client';

const BASE_URL = '/v1/admin/carts';

export const getCarts = (params) => 
  api.get(BASE_URL, { params });

export const getCartDetails = (id) => 
  api.get(`${BASE_URL}/${id}`);



export const convertCartToSale = (id) => {
  return axios.post(`${BASE_URL}/${id}/convert`);
};

export const sendCartReminder = (id) => {
  return axios.post(`${BASE_URL}/${id}/reminder`);
};

export const deleteCart = (id) => {
  return axios.delete(`${BASE_URL}/${id}`);
};
