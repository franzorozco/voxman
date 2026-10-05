import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '../../config/api';

export const useShopSettingsStore = create((set, get) => ({
  settings: {},
  loading: false,
  fetched: false,
  error: null,

  fetchSettings: async (force = false) => {
    if (!force && (get().fetched || get().loading)) return;

    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/v1/shop/settings`);
      set({ settings: response.data, fetched: true, error: null });
    } catch (error) {
      console.error('Error fetching settings:', error);
      set({
        error: error?.response?.data?.message ?? error?.message ?? 'Error al cargar la configuraciÃ³n.',
      });
    } finally {
      set({ loading: false });
    }
  },
}));
