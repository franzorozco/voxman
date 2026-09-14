import { getImageUrl } from '../../../utils/imageUtils';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, Loader2 } from 'lucide-react';
import useShopCartStore from '../../../store/shop/useShopCartStore';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import { getShopProfile } from '../../../api/shop/auth';
import CheckoutAuthModal from '../../../components/ui/CheckoutAuthModal';
import CheckoutLoginModal from '../../../components/ui/CheckoutLoginModal';
import CheckoutGuestModal from '../../../components/ui/CheckoutGuestModal';
import CheckoutCustomerModal from '../../../components/ui/CheckoutCustomerModal';
import CheckoutDeliveryModal from '../../../components/ui/CheckoutDeliveryModal';
import CheckoutUserModal from '../../../components/ui/CheckoutUserModal';
import CheckoutConflictModal from '../../../components/ui/CheckoutConflictModal';
import './CartView.css';

const CartView = () => {
  const { items, total, fetchCart, updateQuantity, removeFromCart, isLoading, appliedGlobalDiscount } = useShopCartStore();
  const globalUser = useAuthStore((state) => state.user);
  const { isDark } = useThemeStore();
  const [removingId, setRemovingId] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [stockConflicts, setStockConflicts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    window.appliedShopDiscount = appliedDiscount;
  }, [appliedDiscount]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (appliedGlobalDiscount && !appliedDiscount) {
      setAppliedDiscount({
        id: appliedGlobalDiscount.id,
        code: appliedGlobalDiscount.code,
        discount_amount: appliedGlobalDiscount.amount
      });
      setDiscountCode(appliedGlobalDiscount.code);
    }
  }, [appliedGlobalDiscount]);

  const handleUpdateQuantity = async (productId, variantId, quantity, cartItemId) => {
    if (quantity < 1) return;
    await updateQuantity(productId, variantId, quantity, cartItemId);
  };

  const handleRemove = async (productId, variantId, uniqueId) => {
    setRemovingId(uniqueId);
    await removeFromCart(productId, variantId, uniqueId);
    setTimeout(() => {
      setRemovingId(null);
    }, 300);
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountLoading(true);
    try {
      const { default: api } = await import('../../../api/client');
      // Prepare items as {variant_id, quantity, line_subtotal, bundle_group_id}
      const mappedItems = items.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        line_subtotal: parseFloat(item.price) * item.quantity,
        bundle_group_id: item.bundle_group_id || null
      }));
      
      // Extract actual Customer ID
      let actualCustomerId = null;
      const userSource = currentUser || globalUser;
      if (userSource) {
        if (userSource.customers && userSource.customers.length > 0) {
          actualCustomerId = userSource.customers[0].id;
        } else {
          actualCustomerId = userSource.id;
        }
      }
      
      const payload = {
        code: discountCode,
        subtotal: total,
        items: mappedItems,
        customer_id: actualCustomerId
      };
      
      const res = await api.post('/v1/shop/cart/validate-code', payload);
      if (res.data.valid) {
        // Save the discount in the backend cart session
        await api.post('/v1/shop/cart/apply-discount', {
          discount_code: res.data.code,
          discount_id: res.data.id,
          discount_amount: res.data.discount_amount
        });
        
        const appliedData = {
          id: res.data.id,
          code: res.data.code,
          amount: res.data.discount_amount,
          new_total: res.data.new_total || (total - res.data.discount_amount)
        };

        setAppliedDiscount(res.data);
        useShopCartStore.setState({ appliedGlobalDiscount: appliedData });
        
        import('react-hot-toast').then(({ default: toast }) => {
          toast.success("Cupón aplicado exitosamente");
        });
      } else {
        setAppliedDiscount(null);
        useShopCartStore.setState({ appliedGlobalDiscount: null });
        import('react-hot-toast').then(({ default: toast }) => {
          toast.error(res.data.message || "Cupón inválido");
        });
      }
    } catch (err) {
      console.error(err);
      setAppliedDiscount(null);
      useShopCartStore.setState({ appliedGlobalDiscount: null });
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error(err.response?.data?.message || "Error al validar el cupón");
      });
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRemoveDiscount = async () => {
    try {
      const { default: api } = await import('../../../api/client');
      await api.post('/v1/shop/cart/remove-discount');
    } catch (e) {
      console.error(e);
    }
    setAppliedDiscount(null);
    useShopCartStore.setState({ appliedGlobalDiscount: null });
    setDiscountCode('');
  };

  const handleCheckoutClick = async () => {
    setIsCheckingOut(true);

    try {
      const { default: api } = await import('../../../api/client');
      const res = await api.post('/v1/shop/cart/validate');
      if (!res.data.valid) {
        import('react-hot-toast').then(({ default: toast }) => {
          toast.error(res.data.message, { duration: 5000 });
        });
        useShopCartStore.setState({ 
          items: res.data.cart.items || [], 
          total: res.data.cart.total || 0 
        });
        if (!res.data.cart.items || res.data.cart.items.length === 0) {
          setIsCheckingOut(false);
          return;
        }
      }
    } catch (err) {
      console.error("Error validando stock", err);
      setIsCheckingOut(false);
      return;
    }

    const shopAuthToken = localStorage.getItem('shop_auth_token');
    
    // Check if user is already logged in (Shop Session)
    if (shopAuthToken) {
      try {
        const res = await getShopProfile();
        const fullUser = res.data.user;
        localStorage.setItem("shop_user", JSON.stringify(fullUser));
        handleLoginSuccess(fullUser);
      } catch (e) {
        // Token invalid or expired
        localStorage.removeItem("shop_auth_token");
        localStorage.removeItem("shop_user");
        setIsAuthModalOpen(true);
      }
    } 
    // Check if user is already logged in (Global Session)
    else if (globalUser) {
      try {
        const res = await getShopProfile();
        const fullUser = res.data.user;
        localStorage.setItem("shop_user", JSON.stringify(fullUser));
        handleLoginSuccess(fullUser);
      } catch (e) {
        setIsAuthModalOpen(true);
      }
    } 
    // Not logged in at all
    else {
      localStorage.removeItem("shop_user");
      setIsAuthModalOpen(true);
    }
    
    setIsCheckingOut(false);
  };

  const handleModalOption = (option) => {
    setIsAuthModalOpen(false);
    if (option === 'user') {
      setTimeout(() => setIsLoginModalOpen(true), 300);
    } else if (option === 'guest') {
      setTimeout(() => setIsGuestModalOpen(true), 300);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    
    const hasCustomer = user.customers && user.customers.length > 0;
    
    if (!hasCustomer) {
      setTimeout(() => setIsCustomerModalOpen(true), 300);
    } else {
      setTimeout(() => setIsDeliveryModalOpen(true), 300);
    }
  };

  const handleCustomerSuccess = (updatedUser) => {
    setCurrentUser(updatedUser);
    setIsCustomerModalOpen(false);
    setTimeout(() => setIsDeliveryModalOpen(true), 300);
  };

  const handleDeliverySuccess = (selectedType) => {
    setDeliveryType(selectedType);
    setIsDeliveryModalOpen(false);
    setTimeout(() => setIsUserModalOpen(true), 300);
  };

  return (
    <div className="cart-page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest mb-10 cart-title text-center">Cesta de Compra</h1>

      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
        {/* CART ITEMS */}
        <div className="lg:col-span-7">
          <section aria-labelledby="cart-heading">
            <h2 id="cart-heading" className="sr-only">
              Artículos en tu cesta
            </h2>

            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg cart-empty-text mb-4">Tu cesta está vacía</p>
                <Link to="/shop" className="text-indigo-600 hover:text-indigo-500 font-medium cart-empty-link">
                  Continuar comprando
                </Link>
              </div>
            ) : (
              <ul role="list" className="border-t border-b border-gray-200 divide-y divide-gray-200 cart-items-list">
                {items.map((item, index) => {
                  const uniqueId = item.id || `${item.product_id}-${item.variant_id || 'none'}-${index}`;
                  return (
                    <li key={uniqueId} className={`flex py-6 cart-item ${removingId === uniqueId ? 'cart-item-removing' : ''}`}>
                      <div className="flex-shrink-0">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="w-24 h-24 rounded-md object-center object-cover sm:w-32 sm:h-32 cart-item-img"
                        />
                      </div>

                      <div className="ml-4 flex-1 flex flex-col sm:ml-6">
                        <div>
                          <div className="flex justify-between">
                            <div className="flex flex-col">
                              <h4 className="text-sm cart-item-name">
                                <Link to={`/shop/product/${item.product_id}`} className="font-medium hover:underline">
                                  {item.name}
                                </Link>
                              </h4>
                              {item.bundle_group_id && (
                                <span style={{ fontSize: '11px', color: '#b45309', fontWeight: '600', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', width: 'fit-content', marginTop: '6px', border: '1px solid #fde68a' }}>
                                  📦 Ítem de Conjunto
                                </span>
                              )}
                            </div>
                            <div className="ml-4 text-right">
                              {item.discount_label ? (
                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '8px' }}>
                                  <p style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.8rem' }}>
                                    Bs {parseFloat(item.original_price || item.price).toFixed(2)}
                                  </p>
                                  <p className="text-sm font-bold text-gray-900">Bs {parseFloat(item.price).toFixed(2)}</p>
                                  <span style={{ border: '1px solid #111827', color: '#111827', padding: '1px 4px', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                                    {item.discount_label}
                                  </span>
                                </div>
                              ) : (
                                <p className="text-sm font-medium cart-item-price text-gray-900">Bs {parseFloat(item.price).toFixed(2)}</p>
                              )}
                            </div>
                          </div>
                          
                          {(item.color || item.size) && (
                            <div className="mt-1 text-sm cart-item-attributes space-y-1">
                              <p>{item.color} {item.color && item.size ? '•' : ''} {item.size ? `Talla ${item.size}` : ''}</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex-1 flex items-end justify-between">
                          <div className="flex items-center border border-gray-300 rounded-none cart-quantity-container">
                            <button
                              type="button"
                              className="p-2 text-gray-500 hover:text-black transition-colors cart-quantity-btn"
                              onClick={() => handleUpdateQuantity(item.product_id, item.variant_id, item.quantity - 1, item.id)}
                              disabled={item.quantity <= 1 || isLoading}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 text-sm font-medium cart-quantity-text">{item.quantity}</span>
                            <button
                              type="button"
                              className="p-2 text-gray-500 hover:text-black transition-colors cart-quantity-btn"
                              onClick={() => handleUpdateQuantity(item.product_id, item.variant_id, item.quantity + 1, item.id)}
                              disabled={isLoading}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="ml-4">
                            <button
                              type="button"
                              className="text-gray-400 hover:text-red-600 transition-colors p-2"
                              onClick={() => handleRemove(item.product_id, item.variant_id, uniqueId)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* ORDER SUMMARY */}
        <div className="mt-16 bg-transparent border border-gray-200 rounded-none px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5 cart-summary-box">
          <h2 className="text-lg font-bold uppercase tracking-widest cart-summary-title">Resumen de compra</h2>

          {/* Discount Input Area */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <label htmlFor="discount-code" className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Código de descuento
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="discount-code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                disabled={appliedDiscount !== null || discountLoading}
                className="flex-1 rounded-none border-b border-t-0 border-l-0 border-r-0 border-gray-300 px-0 py-2 text-sm bg-transparent focus:border-black focus:outline-none focus:ring-0 disabled:text-gray-400 uppercase"
                placeholder="Ingresa tu cupón"
              />
              {appliedDiscount ? (
                <button
                  type="button"
                  onClick={handleRemoveDiscount}
                  className="rounded-none border border-red-600 bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                >
                  Quitar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={!discountCode.trim() || discountLoading}
                  className="rounded-none border border-black bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                >
                  {discountLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                </button>
              )}
            </div>
            {appliedDiscount && (
              <p className="mt-2 text-xs text-green-600 font-bold uppercase tracking-wider flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                {appliedDiscount.message || "Descuento aplicado"}
              </p>
            )}
          </div>

          <dl className="mt-4 space-y-4 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <dt className="text-sm font-medium text-gray-500 cart-summary-label">Subtotal</dt>
              <dd className="text-sm font-medium cart-summary-value">Bs {total.toFixed(2)}</dd>
            </div>
            
            {appliedDiscount && (
              <div className="flex items-center justify-between text-gray-900">
                <dt className="text-sm font-medium">Descuento ({appliedDiscount.code})</dt>
                <dd className="text-sm font-bold">-Bs {parseFloat(appliedDiscount.discount_amount).toFixed(2)}</dd>
              </div>
            )}
            
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="text-base font-bold uppercase tracking-wider cart-summary-total-label">Total estimado</dt>
              <dd className="text-base font-bold cart-summary-total-value">
                Bs {appliedDiscount ? (total - parseFloat(appliedDiscount.discount_amount)).toFixed(2) : total.toFixed(2)}
              </dd>
            </div>
          </dl>

          <div className="mt-8 mb-4">
            <button
              onClick={handleCheckoutClick}
              disabled={items.length === 0 || isCheckingOut}
              className={`w-full py-4 px-6 rounded-none text-sm font-bold uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-3 relative group overflow-hidden ${
                items.length === 0 || isCheckingOut
                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-white hover:text-black border border-black active:scale-[0.98]'
              }`}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="relative z-10">Procesando...</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">Realizar Orden</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 relative z-10 transition-transform duration-300 ${items.length === 0 ? '' : 'group-hover:translate-x-1.5'}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
          <div className="mt-4 text-center">
             <Link to="/shop" className="text-sm font-medium cart-continue-link">
               o Continuar comprando<span aria-hidden="true"> &rarr;</span>
             </Link>
          </div>
        </div>
      </div>

      <CheckoutAuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSelectOption={handleModalOption}
        theme={isDark ? 'dark' : 'light'} 
      />

      <CheckoutLoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onSuccessRedirect={handleLoginSuccess}
        theme={isDark ? 'dark' : 'light'}
      />

      <CheckoutGuestModal 
        isOpen={isGuestModalOpen} 
        onClose={() => setIsGuestModalOpen(false)} 
        theme={isDark ? 'dark' : 'light'}
      />

      <CheckoutCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={handleCustomerSuccess}
        theme={isDark ? 'dark' : 'light'}
        initialData={currentUser || {}}
      />

      <CheckoutDeliveryModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        onSuccess={handleDeliverySuccess}
        user={currentUser}
        theme={isDark ? 'dark' : 'light'}
      />

      <CheckoutUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={currentUser}
        deliveryType={deliveryType}
        theme={isDark ? 'dark' : 'light'}
        cartItems={items}
        totalAmount={total}
        appliedGlobalDiscount={appliedGlobalDiscount}
        isAuth={!!currentUser}
        cartToken={localStorage.getItem('shop_cart_token')}
      />

      <CheckoutConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflicts={stockConflicts}
        theme={isDark ? 'dark' : 'light'}
      />

    </div>
  );
};

export default CartView;
