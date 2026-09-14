import api from "../client";

/**
 * Obtiene todas las URLs de imagenes de variantes (paginadas)
 * para usar en el selector del Hero.
 */
export const getVariantImages = async (page = 1) => {
  const response = await api.get(`/v1/admin/home-config/variant-images?page=${page}`);
  return response.data; // { data: string[], current_page, last_page, total }
};

/**
 * Guarda el valor de una setting de home_config.
 * Reutiliza el endpoint generico de system-settings.
 */
export const updateHomeSetting = async (key, value) => {
  const response = await api.put(`/v1/admin/system-settings/${key}`, { value });
  return response.data;
};
