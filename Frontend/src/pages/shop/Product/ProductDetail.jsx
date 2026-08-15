import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProduct } from '../../../api/shop/products';
import useShopCartStore from '../../../store/shop/useShopCartStore';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const addToCart = useShopCartStore((state) => state.addToCart);
  const isCartLoading = useShopCartStore((state) => state.isLoading);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await getProduct(id);
        setProduct(response.data);
      } catch (error) {
        console.error('Error loading product details', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    // Assuming default variant or standard product without variant for now
    addToCart(product.id, null, 1);
  };

  if (isLoading) return <div className="p-8 text-center">Cargando...</div>;
  if (!product) return <div className="p-8 text-center">Producto no encontrado</div>;

  return (
    <div className="bg-white">
      <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Image gallery */}
          <div className="flex flex-col-reverse">
            <div className="w-full aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
               {/* Main Image Placeholder */}
            </div>
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>
            
            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl text-gray-900">${product.price}</p>
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="text-base text-gray-700 space-y-6" dangerouslySetInnerHTML={{ __html: product.description || 'Sin descripción' }} />
            </div>

            <div className="mt-10 flex sm:flex-col1">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isCartLoading}
                className="max-w-xs flex-1 bg-gray-900 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-gray-900 sm:w-full disabled:opacity-50"
              >
                {isCartLoading ? 'Añadiendo...' : 'Añadir al Carrito'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
