import { URL_BASE_VIDEOS } from '../config/api';

export const getVideoUrl = (url) => {
  if (!url) return "";
  
  // Si la URL ya es completa (ej: youtube, vimeo, o un bucket externo pegado directamente)
  if (url.startsWith('http')) return url;

  // Limpiamos la barra inicial si la tiene
  let cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  
  // Concatenamos con la URL base de videos definida en api.js
  return URL_BASE_VIDEOS + '/' + cleanUrl;
};
