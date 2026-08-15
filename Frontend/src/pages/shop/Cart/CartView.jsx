import React, { useEffect } from 'react';
import useShopCartStore from '../../../store/shop/useShopCartStore';

const CartView = () => {
  const { items, total, fetchCart, isLoading } = useShopCartStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  if (isLoading) {
    return <div className="p-8 text-center">Cargando carrito...</div>;
  }

  return (
    <div className="bg-white">
      <div className="max-w-2xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Carrito de Compras
        </h1>

        <form className="mt-12 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          <section aria-labelledby="cart-heading" className="lg:col-span-7">
            <h2 id="cart-heading" className="sr-only">Items in your shopping cart</h2>

            <ul role="list" className="border-t border-b border-gray-200 divide-y divide-gray-200">
              {items.length === 0 ? (
                <li className="py-6 text-center text-gray-500">
                  Tu carrito está vacío.
                </li>
              ) : (
                items.map((item, productIdx) => (
                  <li key={productIdx} className="flex py-6 sm:py-10">
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 rounded-md object-center object-cover sm:w-48 sm:h-48 bg-gray-200"></div>
                    </div>

                    <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                      <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                        <div>
                          <div className="flex justify-between">
                            <h3 className="text-sm">
                              <a href="#" className="font-medium text-gray-700 hover:text-gray-800">
                                Producto ID: {item.product_id}
                              </a>
                            </h3>
                          </div>
                          <p className="mt-1 text-sm font-medium text-gray-900">Cantidad: {item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Order summary */}
          <section
            aria-labelledby="summary-heading"
            className="mt-16 bg-gray-50 rounded-lg px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5"
          >
            <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
              Resumen del Pedido
            </h2>

            <dl className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Subtotal</dt>
                <dd className="text-sm font-medium text-gray-900">${total}</dd>
              </div>
              <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                <dt className="text-base font-medium text-gray-900">Total</dt>
                <dd className="text-base font-medium text-gray-900">${total}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <button
                type="button"
                className="w-full bg-gray-900 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-gray-900"
              >
                Proceder al Pago
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
};

export default CartView;
