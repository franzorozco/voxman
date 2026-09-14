import api from "../client";

/**
 * Obtiene todas las URLs de imagenes de variantes (paginadas)
 * para usar en el selector del Hero.
 */
export const getVariantImages = async (page = 1) => {
  const response = await api.get(`/v1/admin/home-config/variant-images?page=${page}`);
  return response.data; // { data: string[], current_page, last_page, total }
};

export const getCategories = async () => {
  const response = await api.get(`/v1/admin/home-config/categories`);
  return response.data;
};

export const uploadCategoryImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post(`/v1/admin/home-config/upload-category-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data; // { url }
};
/**
 * Guarda el valor de una setting de home_config.
 * Reutiliza el endpoint generico de system-settings.
 */
export const updateHomeSetting = async (key, value) => {
  const response = await api.put(`/v1/admin/system-settings/${key}`, { value });
  return response.data;
};
