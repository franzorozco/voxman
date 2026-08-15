import React, { useEffect, useState } from 'react';
import { getProducts } from '../../../api/shop/products';
import './Catalog.css';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();
        setProducts(response.data.data || []);
      } catch (error) {
        console.error('Error loading products', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 catalog-container">
      <div className="flex items-baseline justify-between catalog-header-border pb-6 pt-24">
        <h1 className="text-4xl font-extrabold tracking-tight catalog-title">Catálogo</h1>
      </div>

      <section aria-labelledby="products-heading" className="pb-24 pt-6">
        <h2 id="products-heading" className="sr-only">Products</h2>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <form className="hidden lg:block">
            <h3 className="sr-only">Categorías</h3>
            <ul role="list" className="space-y-4 catalog-filter-list pb-6 text-sm font-medium">
              <li><a href="#" className="catalog-filter-link">Todas las Categorías</a></li>
              <li><a href="#" className="catalog-filter-link">Camisetas</a></li>
              <li><a href="#" className="catalog-filter-link">Pantalones</a></li>
              <li><a href="#" className="catalog-filter-link">Accesorios</a></li>
            </ul>
          </form>

          {/* Product grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <p>Cargando productos...</p>
            ) : (
              <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                {products.length === 0 ? (
                  <p>No se encontraron productos.</p>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="group relative">
                      <div className="w-full min-h-80 aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75 lg:h-80 lg:aspect-none catalog-product-img-placeholder">
                        {/* Placeholder for product image */}
                      </div>
                      <div className="mt-4 flex justify-between">
                        <div>
                          <h3 className="text-sm catalog-product-title">
                            <a href={`/shop/product/${product.id}`}>
                              <span aria-hidden="true" className="absolute inset-0"></span>
                              {product.name}
                            </a>
                          </h3>
                        </div>
                        <p className="text-sm font-medium catalog-product-price">${product.price}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Catalog;
