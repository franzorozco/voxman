import api from '../client';

export const getDeliverySchedules = (params = {}) => {
  return api.get('/v1/admin/order-network', { params });
};

export const getDeliveryDrivers = () => {
  return api.get('/v1/admin/order-network/drivers');
};

export const convertToOrder = (data) => {
  return api.post('/v1/admin/order-network/convert', data);
};

export const updateDeliveryStatus = (id, status) => {
  return api.post(`/v1/admin/order-network/${id}/status`, { status });
};

export const assignDriver = (id, driver_id) => {
  return api.post(`/v1/admin/order-network/${id}/driver`, { driver_id });
};
