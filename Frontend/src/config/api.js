export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// LOCAL: http://localhost:8000
// TUNNEL: https://networking-suggesting-highlight-pumps.trycloudflare.com

export const API_URL =
  `${API_BASE_URL}/api`;
export const URL_BASE_IMG = 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev';
export const URL_BASE_IMG_LOCAL = 'http://localhost:8000/media';
export const URL_BASE_VIDEOS = 'https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev';
export const URL_BASE_VIDEOS_LOCAL = 'http://localhost:8000/media';

export const FRONTEND_URL = window.location.origin;
