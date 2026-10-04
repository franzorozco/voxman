import { API_BASE_URL, URL_BASE_IMG } from '../config/api';

export const getImageUrl = (url) => {
  if (!url) {
    const theme = localStorage.getItem("dashboardTheme");
    return theme === "dark" 
      ? "/system/not-found/image_not_found_black.jfif"
      : "/system/not-found/image_not_found_white.jfif";
  }
  if (url.startsWith('http')) return url;

  let cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  
  return URL_BASE_IMG + '/' + cleanUrl;
};
