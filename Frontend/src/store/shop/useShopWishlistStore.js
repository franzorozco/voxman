import { create } from 'zustand';
import api from '../../api/client';
import toast from 'react-hot-toast';

const useShopWishlistStore = create((set, get) => ({
  items: [],
  loading: false,

  fetchWishlist: async () => {
    try {
      set({ loading: true });
      const response = await api.get('/v1/shop/wishlist');
      set({ items: response.data.items || [], loading: false });
    } catch (error) {
      // Silently fail if user is not logged in (401/403)
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
      if (response.data.status === 'added') {
        toast.success('Agregado a favoritos ❤️');
      } else {
        toast('Eliminado de favoritos', { icon: '🤍' });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      // Revert optimistic UI on error
      set({ items: currentItems });
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Inicia sesión para guardar favoritos.');
      } else {
        toast.error('No se pudo actualizar favoritos.');
      }
    }
  },

  isInWishlist: (productId, variantId = null) => {
    return get().items.some(i => i.product_id === productId && i.variant_id == variantId);
  }
}));

export default useShopWishlistStore;
