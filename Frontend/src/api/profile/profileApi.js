import api from '../client';

/**
 * Obtener perfil completo del usuario autenticado
 */
export const getProfile = async () => {
  const res = await api.get('/v1/shop/profile');
  return res.data;
};

/**
 * Actualizar datos personales del cliente
 */
export const updateProfile = async (data) => {
  const res = await api.post('/v1/shop/customer-profile', data);
  return res.data;
};

/**
 * Cambiar contraseÃ±a de la cuenta
 */
export const changePassword = async ({ current_password, new_password, new_password_confirmation }) => {
  const res = await api.put('/v1/shop/profile/password', {
    current_password,
    new_password,
    new_password_confirmation
  });
  return res.data;
};

/**
 * Agregar una nueva direcciÃ³n de envÃ­o
 */
export const addAddress = async (data) => {
  const res = await api.post('/v1/shop/delivery-options/add-address', data);
  return res.data;
};

/**
 * Actualizar una direcciÃ³n existente
 */
export const updateAddress = async (id, data) => {
  const res = await api.put(`/v1/shop/delivery-options/addresses/${id}`, data);
  return res.data;
};

/**
 * Eliminar una direcciÃ³n
 */
export const deleteAddress = async (id) => {
  const res = await api.delete(`/v1/shop/delivery-options/addresses/${id}`);
  return res.data;
};

/**
 * Obtener historial de pedidos del cliente autenticado
 */
export const getMyOrders = async (params = {}) => {
  const res = await api.get('/v1/shop/my-orders', { params });
  return res.data;
};
