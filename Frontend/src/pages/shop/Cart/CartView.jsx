import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import useShopCartStore from '../../../store/shop/useShopCartStore';
import { useThemeStore } from '../../../store/themeStore';
import { API_BASE_URL } from '../../../config/api';
import CheckoutAuthModal from '../../../components/ui/CheckoutAuthModal';
import CheckoutLoginModal from '../../../components/ui/CheckoutLoginModal';
import CheckoutGuestModal from '../../../components/ui/CheckoutGuestModal';
import './CartView.css';

const CartView = () => {
  const { items, total, fetchCart, updateQuantity, removeFromCart, isLoading } = useShopCartStore();
  const { isDark } = useThemeStore();
  const [removingId, setRemovingId] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
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

  const handleCheckoutClick = () => {
    // Determine if user is logged in here in the future
    // For now, always show modal
    setIsAuthModalOpen(true);
  };

  const handleModalOption = (option) => {
    setIsAuthModalOpen(false);
    if (option === 'user') {
      setTimeout(() => setIsLoginModalOpen(true), 300);
    } else if (option === 'guest') {
      setTimeout(() => setIsGuestModalOpen(true), 300);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return `${API_BASE_URL}/storage/products/default.jpg`;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}/storage/${path}`;
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
              className={`w-full cart-checkout-btn py-3 px-4 rounded-md shadow-sm text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 ${
                items.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Proceder al Checkout
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
        theme={isDark ? 'dark' : 'light'}
      />

      <CheckoutGuestModal 
        isOpen={isGuestModalOpen} 
        onClose={() => setIsGuestModalOpen(false)} 
        onSuccessRedirect="/shop/checkout"
        theme={isDark ? 'dark' : 'light'}
      />
    </div>
  );
};

export default CartView;
