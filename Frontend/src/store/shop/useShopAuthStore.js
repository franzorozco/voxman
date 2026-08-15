import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as apiLogin, logout as apiLogout } from '../../api/shop/auth';

const useShopAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (credentials) => {
        try {
          const response = await apiLogin(credentials);
          const { token, user } = response.data;
          
          set({ user, token, isAuthenticated: true });
          localStorage.setItem('shop_auth_token', token);
          
          return { success: true };
        } catch (error) {
          return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
      },

      logout: async () => {
        try {
          await apiLogout();
        } catch (error) {
          console.error('Logout failed:', error);
        } finally {
          set({ user: null, token: null, isAuthenticated: false });
          localStorage.removeItem('shop_auth_token');
        }
      }
    }),
    {
      name: 'shop-auth-storage',
    }
  )
);

export default useShopAuthStore;
