import { create } from 'zustand';
import api from '../../api/client';

const useShopWishlistStore = create((set, get) => ({
  items: [],
  loading: false,

  fetchWishlist: async () => {
    try {
      set({ loading: true });
      const response = await api.get('/v1/shop/wishlist');
      set({ items: response.data.items || [], loading: false });
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      set({ loading: false });
    }
  },

  toggleWishlist: async (productId, variantId = null) => {
    const currentItems = get().items;
    const existing = currentItems.find(i => i.product_id === productId && i.variant_id === variantId);
    
    // Optimistic UI update
    if (existing) {
      set({ items: currentItems.filter(i => i.id !== existing.id) });
    } else {
      set({ items: [...currentItems, { id: 'temp-' + Date.now(), product_id: productId, variant_id: variantId }] });
    }

    try {
      const response = await api.post('/v1/shop/wishlist/toggle', { product_id: productId, variant_id: variantId });
      set({ items: response.data.items || [] });
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      // Revert optimistic UI on error
      set({ items: currentItems });
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Debes iniciar sesión como cliente para usar la lista de deseos.');
      }
    }
  },

  isInWishlist: (productId, variantId = null) => {
    return get().items.some(i => i.product_id === productId && i.variant_id == variantId);
  }
}));

export default useShopWishlistStore;
