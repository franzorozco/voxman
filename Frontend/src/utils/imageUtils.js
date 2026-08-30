import { API_BASE_URL, URL_BASE_IMG } from '../config/api';

export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;

  let cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  
  return URL_BASE_IMG + '/' + cleanUrl;
};
