import client from '../client';

export const lookupGuestSale = async (data) => {
  return await client.post('/v1/shop/returns/lookup', data);
};

export const requestReturn = async (data) => {
  return await client.post('/v1/shop/returns/request', data);
};

export const checkGuestReturnStatus = async (params) => {
  return await client.get('/v1/shop/returns/guest-status', { params });
};
