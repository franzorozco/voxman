import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProduct } from '../../../api/shop/products';
import useShopCartStore from '../../../store/shop/useShopCartStore';
import './ProductDetail.css';

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
    addToCart(product.id, null, 1);
  };

  if (isLoading) return <div className="p-8 text-center product-detail-container">Cargando...</div>;
  if (!product) return <div className="p-8 text-center product-detail-container">Producto no encontrado</div>;

  return (
    <div className="product-detail-container">
      <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Image gallery */}
          <div className="flex flex-col-reverse">
            <div className="w-full aspect-w-1 aspect-h-1 rounded-lg overflow-hidden product-detail-img-placeholder">
               {/* Main Image Placeholder */}
            </div>
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight product-detail-title">{product.name}</h1>
            
            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl product-detail-price">${product.price}</p>
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="text-base space-y-6 product-detail-description" dangerouslySetInnerHTML={{ __html: product.description || 'Sin descripción' }} />
            </div>

            <div className="mt-10 flex sm:flex-col1">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isCartLoading}
                className="max-w-xs flex-1 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium sm:w-full disabled:opacity-50 product-detail-btn"
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
