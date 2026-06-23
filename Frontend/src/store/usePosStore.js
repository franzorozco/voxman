import { create } from 'zustand';

export const usePosStore = create((set, get) => ({
    // Estado de la caja y sucursal
    cashRegister: null,
    branchId: null,

    // Estado del carrito
    cartItems: [],
    selectedCustomer: null, // Si es null, es cliente genérico

    // Acciones de Caja
    setCashRegister: (register, branchId) => set({ cashRegister: register, branchId }),
    clearCashRegister: () => set({ cashRegister: null, branchId: null, cartItems: [], selectedCustomer: null }),

    // Acciones del Carrito
    addToCart: (variant, quantity = 1) => {
        const currentItems = get().cartItems;
        const existingItem = currentItems.find(item => item.variant_id === variant.id);

        if (existingItem) {
            // Verificar que no exceda el stock
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > variant.stock) return false; // Fail

            set({
                cartItems: currentItems.map(item =>
                    item.variant_id === variant.id
                        ? { ...item, quantity: newQuantity }
                        : item
                )
            });
        } else {
            if (quantity > variant.stock) return false;

            set({
                cartItems: [...currentItems, {
                    variant_id: variant.id,
                    product_id: variant.product_id,
                    name: variant.name,
                    sku: variant.sku,
                    price: variant.price,
                    stock: variant.stock,
                    quantity: quantity,
                    discount: 0,
                    image: variant.image,
                    attributes: variant.attributes,
                    size: variant.size
                }]
            });
        }
        return true;
    },

    updateQuantity: (variantId, quantity) => {
        set(state => ({
            cartItems: state.cartItems.map(item => 
                item.variant_id === variantId ? { ...item, quantity } : item
            )
        }));
    },

    removeFromCart: (variantId) => {
        set(state => ({
            cartItems: state.cartItems.filter(item => item.variant_id !== variantId)
        }));
    },

    clearCart: () => set({ cartItems: [], selectedCustomer: null }),

    setCustomer: (customer) => set({ selectedCustomer: customer }),

    // Selectores calculados (getters)
    getTotals: () => {
        const items = get().cartItems;
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountTotal = items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
        const total = subtotal - discountTotal;

        return {
            subtotal,
            discountTotal,
            total,
            itemsCount: items.reduce((sum, item) => sum + item.quantity, 0)
        };
    }
}));
