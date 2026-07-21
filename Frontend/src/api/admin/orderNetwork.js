import api from '../client';

export const getDeliverySchedules = (params = {}) => {
  return api.get('/v1/admin/order-network', { params });
};

export const getDeliveryDetails = (id) => {
  return api.get(`/v1/delivery/${id}`);
};

export const getDeliveryDrivers = () => {
  return api.get('/v1/admin/order-network/drivers');
};

export const getDeliveryZones = () => {
  return api.get('/v1/admin/order-network/delivery-zones');
};

export const createDeliveryZone = (data) => {
  return api.post('/v1/admin/order-network/delivery-zones', data);
};

export const updateDeliveryZone = (id, data) => {
  return api.put(`/v1/admin/order-network/delivery-zones/${id}`, data);
};

export const convertToOrder = (data) => {
  return api.post('/v1/admin/order-network/convert', data);
};

export const updateDeliveryStatus = (id, status) => {
  return api.post(`/v1/admin/order-network/${id}/status`, { status });
};

export const updateDeliveryDetails = (id, data) => {
  return api.put(`/v1/admin/order-network/${id}/details`, data);
};

export const updateOrder = (id, data) => {
  return api.put(`/v1/admin/order-network/${id}/order`, data);
};

export const assignDriver = (id, driver_id) => {
  return api.post(`/v1/admin/order-network/${id}/driver`, { driver_id });
};
