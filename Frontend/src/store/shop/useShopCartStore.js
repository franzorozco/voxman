import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getCart, addToCart as apiAddToCart } from '../../api/shop/cart';

const useShopCartStore = create(
  persist(
    (set, get) => ({
      cartToken: null,
      items: [],
      total: 0,
      isLoading: false,

      // Initialize the cart from the backend using the stored token
      fetchCart: async () => {
        set({ isLoading: true });
        try {
          const response = await getCart();
          set({ 
            items: response.data.items || [], 
            total: response.data.total || 0 
          });
        } catch (error) {
          console.error('Failed to fetch cart:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Add a product to the cart
      addToCart: async (productId, variantId, quantity) => {
        set({ isLoading: true });
        try {
          const response = await apiAddToCart({
            product_id: productId,
            variant_id: variantId,
            quantity: quantity,
          });

          // Save the new cart token if the backend generated one
          if (response.data.cart_token) {
            set({ cartToken: response.data.cart_token });
            // The persist middleware will automatically save this to localStorage
            // But we also manually save it so the Axios interceptor can read it synchronously
            localStorage.setItem('shop_cart_token', response.data.cart_token);
          }

          set({ 
            items: response.data.cart.items || [], 
            total: response.data.cart.total || 0 
          });
        } catch (error) {
          console.error('Failed to add to cart:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Additional methods: updateQuantity, removeFromCart, clearCart...
      clearCart: () => {
        set({ cartToken: null, items: [], total: 0 });
        localStorage.removeItem('shop_cart_token');
      }
    }),
    {
      name: 'shop-cart-storage', // unique name for localStorage key
      partialize: (state) => ({ cartToken: state.cartToken }), // Only persist the token, fetch items on load
    }
  )
);

export default useShopCartStore;
