import client from '../client';
const BASE_URL = "/v1/admin/shop-shorts";

export const getShopShorts = () =>
  client.get(BASE_URL);

export const getShopShort = (id) => 
  client.get(`${BASE_URL}/${id}`);

export const createShopShort = (data) => 
  client.post(BASE_URL, data, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export const updateShopShort = (id, data) => 
  client.post(`${BASE_URL}/${id}`, data, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export const deleteShopShort = (id) => 
  client.delete(`${BASE_URL}/${id}`);
