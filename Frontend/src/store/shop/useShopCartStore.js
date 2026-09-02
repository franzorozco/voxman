import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getCart, addToCart as apiAddToCart, updateCartItem as apiUpdateCartItem, removeCartItem as apiRemoveCartItem } from '../../api/shop/cart';

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

      // Add all bundle items proportionally priced
      // items = [{ productId, variantId, originalPrice, color, size }]
      addBundleToCart: async (bundleId, items) => {
        set({ isLoading: true });
        try {
          const totalOriginal = items.reduce((sum, item) => sum + item.originalPrice, 0);
          const bundlePrice = items.reduce((sum, item) => sum + item.bundleItemPrice, 0);
          // bundleItemPrice is already the proportional price computed by the caller
          // We use bundleId + timestamp as a unique group ID for this purchase event
          const bundleGroupId = `${bundleId}_${Date.now()}`;

          let lastResponse = null;
          for (const item of items) {
            const response = await apiAddToCart({
              product_id: item.productId,
              variant_id: item.variantId || null,
              quantity: 1,
              color: item.color || null,
              bundle_group_id: bundleGroupId,
              original_price: item.originalPrice,
              override_price: item.bundleItemPrice,
            });
            lastResponse = response;
            // Update token after first item
            if (response.data.cart_token) {
              set({ cartToken: response.data.cart_token });
              localStorage.setItem('shop_cart_token', response.data.cart_token);
            }
          }

          if (lastResponse) {
            set({
              items: lastResponse.data.cart.items || [],
              total: lastResponse.data.cart.total || 0
            });
          }
        } catch (error) {
          console.error('Failed to add bundle to cart:', error.response?.data || error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Additional methods: updateQuantity, removeFromCart, clearCart...
      updateQuantity: async (productId, variantId, quantity) => {
        set({ isLoading: true });
        try {
          const response = await apiUpdateCartItem({
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

      removeFromCart: async (productId, variantId) => {
        set({ isLoading: true });
        try {
          const response = await apiRemoveCartItem({
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
