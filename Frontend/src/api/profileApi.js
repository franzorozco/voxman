import api from './client';

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
 * Cambiar contraseña de la cuenta
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
 * Agregar una nueva dirección de envío
 */
export const addAddress = async (data) => {
  const res = await api.post('/v1/shop/delivery-options/add-address', data);
  return res.data;
};

/**
 * Actualizar una dirección existente
 */
export const updateAddress = async (id, data) => {
  const res = await api.put(`/v1/shop/delivery-options/addresses/${id}`, data);
  return res.data;
};

/**
 * Eliminar una dirección
 */
export const deleteAddress = async (id) => {
  const res = await api.delete(`/v1/shop/delivery-options/addresses/${id}`);
  return res.data;
};
