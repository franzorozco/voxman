import { getImageUrl } from '../../../utils/imageUtils';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import useShopCartStore from '../../../store/shop/useShopCartStore';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import { getShopProfile } from '../../../api/shopAuth';
import CheckoutAuthModal from '../../../components/ui/CheckoutAuthModal';
import CheckoutLoginModal from '../../../components/ui/CheckoutLoginModal';
import CheckoutGuestModal from '../../../components/ui/CheckoutGuestModal';
import CheckoutCustomerModal from '../../../components/ui/CheckoutCustomerModal';
import CheckoutUserModal from '../../../components/ui/CheckoutUserModal';
import './CartView.css';

const CartView = () => {
  const { items, total, fetchCart, updateQuantity, removeFromCart, isLoading } = useShopCartStore();
  const globalUser = useAuthStore((state) => state.user);
  const { isDark } = useThemeStore();
  const [removingId, setRemovingId] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQuantity = async (productId, variantId, quantity) => {
    if (quantity < 1) return;
    await updateQuantity(productId, variantId, quantity);
  };

  const handleRemove = async (productId, variantId, uniqueId) => {
    setRemovingId(uniqueId);
    await removeFromCart(productId, variantId);
    setTimeout(() => {
      setRemovingId(null);
    }, 300);
  };

  const handleCheckoutClick = async () => {
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
    
    // Check if user has customer profile
    const hasCustomer = user.customers && user.customers.length > 0;
    
    if (!hasCustomer) {
      setTimeout(() => setIsCustomerModalOpen(true), 300);
    } else {
      setTimeout(() => setIsUserModalOpen(true), 300);
    }
  };

  const handleCustomerSuccess = (updatedUser) => {
    setCurrentUser(updatedUser);
    setIsCustomerModalOpen(false);
    setTimeout(() => setIsUserModalOpen(true), 300);
  };

  return (
    <div className="cart-page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight mb-10 cart-title text-center">Cesta de Compra</h1>

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
                            <h4 className="text-sm cart-item-name">
                              <Link to={`/shop/product/${item.product_id}`} className="font-medium hover:underline">
                                {item.name}
                              </Link>
                            </h4>
                            <p className="ml-4 text-sm font-medium cart-item-price">Bs {parseFloat(item.price).toFixed(2)}</p>
                          </div>
                          
                          {(item.color || item.size) && (
                            <div className="mt-1 text-sm cart-item-attributes space-y-1">
                              <p>{item.color} {item.color && item.size ? '•' : ''} {item.size ? `Talla ${item.size}` : ''}</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex-1 flex items-end justify-between">
                          <div className="flex items-center border rounded-md cart-quantity-container">
                            <button
                              type="button"
                              className="p-2 cart-quantity-btn"
                              onClick={() => handleUpdateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || isLoading}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 text-sm font-medium cart-quantity-text">{item.quantity}</span>
                            <button
                              type="button"
                              className="p-2 cart-quantity-btn"
                              onClick={() => handleUpdateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                              disabled={isLoading}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="ml-4">
                            <button
                              type="button"
                              className="text-sm font-medium cart-remove-btn"
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
        <div className="mt-16 bg-gray-50 rounded-lg px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5 cart-summary-box">
          <h2 className="text-lg font-medium cart-summary-title">Resumen de compra</h2>

          <dl className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <dt className="text-sm cart-summary-label">Subtotal</dt>
              <dd className="text-sm font-medium cart-summary-value">Bs {total.toFixed(2)}</dd>
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="text-base font-medium cart-summary-total-label">Total estimado</dt>
              <dd className="text-base font-bold cart-summary-total-value">Bs {total.toFixed(2)}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <button
              onClick={handleCheckoutClick}
              disabled={items.length === 0}
              className={`w-full py-4 px-6 rounded-md text-base font-bold uppercase tracking-[0.1em] transition-all duration-300 flex items-center justify-center gap-3 relative group overflow-hidden ${
                items.length === 0 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-900 active:scale-[0.98] shadow-sm hover:shadow-md'
              }`}
            >
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
        initialData={currentUser?.profile || {}}
      />

      <CheckoutUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={currentUser}
        theme={isDark ? 'dark' : 'light'}
      />

    </div>
  );
};

export default CartView;
