import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getCart, addToCart as apiAddToCart, addBundleToCart as apiAddBundleToCart, updateCartItem as apiUpdateCartItem, removeCartItem as apiRemoveCartItem } from '../../api/shop/cart';

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

      addBundleToCart: async (bundleId, items) => {
        set({ isLoading: true });
        try {
          // Map items to match backend requirements
          const payloadItems = items.map(i => ({
            product_id: i.productId,
            variant_id: i.variantId || null,
            color: i.color || null
          }));

          const response = await apiAddBundleToCart({
            bundle_id: bundleId,
            quantity: 1,
            items: payloadItems
          });

          if (response.data.cart_token) {
            set({ cartToken: response.data.cart_token });
            localStorage.setItem('shop_cart_token', response.data.cart_token);
          }

          set({ 
            items: response.data.cart.items || [], 
            total: response.data.cart.total || 0 
          });
        } catch (error) {
          console.error('Failed to add bundle to cart:', error.response?.data || error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      // Add a product to the cart
      addToCart: async (productId, variantId, quantity, color = null) => {
        set({ isLoading: true });
        try {
          const response = await apiAddToCart({
            product_id: productId,
            variant_id: variantId,
            quantity: quantity,
            color: color
          });

          if (response.data.cart_token) {
            set({ cartToken: response.data.cart_token });
            localStorage.setItem('shop_cart_token', response.data.cart_token);
          }

          set({ 
            items: response.data.cart.items || [], 
            total: response.data.cart.total || 0 
          });
        } catch (error) {
          console.error('Failed to add to cart:', error.response?.data || error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (productId, variantId, quantity, cartItemId = null) => {
        set({ isLoading: true });
        try {
          const response = await apiUpdateCartItem({
            cart_item_id: cartItemId,
            product_id: productId,
            variant_id: variantId,
            quantity: quantity,
          });
          set({ 
            items: response.data.items || [], 
            total: response.data.total || 0 
          });
        } catch (error) {
          console.error('Failed to update quantity:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      removeFromCart: async (productId, variantId, cartItemId = null) => {
        set({ isLoading: true });
        try {
          const response = await apiRemoveCartItem({
            cart_item_id: cartItemId,
            product_id: productId,
            variant_id: variantId,
          });
          set({ 
            items: response.data.items || [], 
            total: response.data.total || 0 
          });
        } catch (error) {
          console.error('Failed to remove from cart:', error);
        } finally {
          set({ isLoading: false });
        }
      },

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
