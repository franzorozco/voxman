import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import useShopCartStore from '../../../store/shop/useShopCartStore';
import { API_BASE_URL } from '../../../config/api';
import './CartView.css';

const CartView = () => {
  const { items, total, fetchCart, updateQuantity, removeFromCart, isLoading } = useShopCartStore();
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  const handleUpdateQuantity = async (productId, variantId, qty) => {
    if (qty < 1) return;
    await updateQuantity(productId, variantId, qty);
  };

  const handleRemove = async (productId, variantId, uniqueId) => {
    setRemovingId(uniqueId);
    // Wait for animation
    setTimeout(async () => {
      await removeFromCart(productId, variantId);
      setRemovingId(null);
    }, 300);
  };

  if (isLoading && items.length === 0) return <div className="p-8 text-center cart-view-container">Cargando carrito...</div>;

  return (
    <div className="cart-view-container">
      <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-0">
        <h1 className="text-3xl font-extrabold text-center tracking-tight cart-view-title sm:text-4xl">Carrito de Compras</h1>

        <form className="mt-12">
          <section aria-labelledby="cart-heading">
            <h2 id="cart-heading" className="sr-only">Items in your shopping cart</h2>

            {items.length === 0 ? (
              <p className="text-center cart-view-empty">Tu carrito está vacío.</p>
            ) : (
              <ul role="list" className="cart-item-list">
                {items.map((item) => {
                  const isRemoving = removingId === item.id;
                  return (
                    <li key={item.id} className={`flex py-6 cart-item-container transition-all duration-300 ${isRemoving ? 'opacity-0 translate-x-4' : 'opacity-100'}`}>
                      <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden bg-gray-100 sm:w-32 sm:h-32">
                        {item.image ? (
                          <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Sin imagen</div>
                        )}
                      </div>

                      <div className="ml-4 flex-1 flex flex-col sm:ml-6">
                        <div>
                          <div className="flex justify-between">
                            <h4 className="text-base font-medium cart-item-title">
                              <Link to={`/shop/product/${item.product_id}${item.color ? `?color=${encodeURIComponent(item.color)}` : ''}`}>
                                {item.name}
                              </Link>
                            </h4>
                          </div>
                          
                          {(item.color || item.size) && (
                            <p className="mt-1 text-sm cart-item-subtitle">
                              {item.color} {item.color && item.size ? '•' : ''} {item.size ? `Talla ${item.size}` : ''}
                            </p>
                          )}
                        </div>
                        
                        <div className="mt-4 flex-1 flex items-end justify-between text-sm">
                          <p className="font-medium text-base cart-item-price">Bs {parseFloat(item.price).toFixed(2)}</p>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <button 
                                type="button" 
                                className="qty-btn"
                                onClick={() => handleUpdateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || isLoading}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="qty-display">{item.quantity}</span>
                              <button 
                                type="button" 
                                className="qty-btn"
                                onClick={() => handleUpdateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                                disabled={isLoading}
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <button 
                              type="button" 
                              className="font-medium cart-item-remove-btn flex items-center gap-1"
                              onClick={() => handleRemove(item.product_id, item.variant_id, item.id)}
                            >
                              <Trash2 size={16} /> <span className="hidden sm:inline">Eliminar</span>
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

          {items.length > 0 && (
            <section aria-labelledby="summary-heading" className="mt-10 cart-summary-container rounded-lg px-4 py-6 sm:p-6 lg:p-8">
              <h2 id="summary-heading" className="sr-only">Order summary</h2>

              <dl className="space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-base font-medium cart-summary-text">Total estimado</dt>
                  <dd className="text-xl font-semibold cart-summary-text">Bs {parseFloat(total).toFixed(2)}</dd>
                </div>
              </dl>

              <div className="mt-6">
                <button
                  type="button"
                  className="w-full border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium cart-summary-btn focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50"
                >
                  Proceder al Checkout
                </button>
              </div>
            </section>
          )}
        </form>
      </div>
    </div>
  );
};

export default CartView;
