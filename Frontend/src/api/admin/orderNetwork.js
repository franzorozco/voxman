import api from '../client';

export const getDeliverySchedules = (params = {}) => {
  return api.get('/v1/admin/order-network', { params });
};

export const getDeliveryDetails = (id) => {
  return api.get(`/v1/delivery/${id}`);
};

export const getDeliveryDrivers = (params = {}) => {
  return api.get('/v1/admin/order-network/drivers', { params });
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

export const updateDeliveryStatus = (id, data) => {
  const payload = typeof data === 'string' ? { status: data } : data;
  return api.post(`/v1/admin/order-network/${id}/status`, payload);
};

export const updateDeliveryDetails = (id, data) => {
  return api.put(`/v1/admin/order-network/${id}/details`, data);
};

export const updateOrder = (id, data) => {
  return api.put(`/v1/admin/order-network/${id}/order`, data);
};

export const addDeliveryItem = (id, variant_id, branch_id) => {
  return api.post(`/v1/admin/order-network/${id}/item`, { variant_id, branch_id });
};

export const removeDeliveryItem = (id, detailId) => {
  return api.delete(`/v1/admin/order-network/${id}/item/${detailId}`);
};

export const restoreDeliveryItem = (id, detailId) => {
  return api.post(`/v1/admin/order-network/${id}/item/${detailId}/restore`);
};

export const assignDriver = (id, driver_id) => {
  return api.post(`/v1/admin/order-network/${id}/driver`, { driver_id });
};
