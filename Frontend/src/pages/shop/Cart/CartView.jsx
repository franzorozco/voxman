import React, { useEffect } from 'react';
import useShopCartStore from '../../../store/shop/useShopCartStore';
import './CartView.css';

const CartView = () => {
  const { items, total, fetchCart, isLoading } = useShopCartStore();

  useEffect(() => {
    fetchCart();
  }, []);

  if (isLoading) return <div className="p-8 text-center cart-view-container">Cargando carrito...</div>;

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
                {items.map((item) => (
                  <li key={item.id} className="flex py-6 cart-item-container">
                    <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden cart-item-img-placeholder sm:w-32 sm:h-32">
                        {/* Placeholder image */}
                    </div>

                    <div className="ml-4 flex-1 flex flex-col sm:ml-6">
                      <div>
                        <div className="flex justify-between">
                          <h4 className="text-sm">
                            <a href={`/shop/product/${item.product_id}`} className="font-medium cart-item-title">
                              Producto #{item.product_id}
                            </a>
                          </h4>
                        </div>
                        <p className="mt-1 text-sm cart-item-subtitle">Cantidad: {item.quantity}</p>
                      </div>
                      <div className="mt-4 flex-1 flex items-end justify-between text-sm">
                        <p className="font-medium cart-item-price">Bs {item.price}</p>
                        <button type="button" className="font-medium cart-item-remove-btn">
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {items.length > 0 && (
            <section aria-labelledby="summary-heading" className="mt-10 cart-summary-container rounded-lg px-4 py-6 sm:p-6 lg:p-8">
              <h2 id="summary-heading" className="sr-only">Order summary</h2>

              <dl className="space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-base font-medium cart-summary-text">Total estimado</dt>
                  <dd className="text-base font-medium cart-summary-text">Bs {total}</dd>
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
