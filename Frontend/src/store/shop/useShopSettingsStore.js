import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '../../config/api';

export const useShopSettingsStore = create((set, get) => ({
  settings: {},
  loading: false,
  fetched: false,
  
  fetchSettings: async (force = false) => {
    if (!force && (get().fetched || get().loading)) return;
    
    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/v1/shop/settings`);
      set({ settings: response.data, fetched: true });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      set({ loading: false });
    }
  }
}));
