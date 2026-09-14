import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { getProducts } from '../../../api/shop/products';
import { getImageUrl } from '../../../utils/imageUtils';
import { useShopSettingsStore } from '../../../store/shop/useShopSettingsStore';
import './DynamicProductCarousel.css';

const FALLBACK_IMAGE = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/image_not_found_black.jfif";

export default function DynamicProductCarousel() {
  const { settings } = useShopSettingsStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const title = settings.home_carousel_title || "LO MÁS NUEVO";
  const listType = settings.home_carousel_type || "newest";

  useEffect(() => {
    const fetchCarouselProducts = async () => {
      try {
        setLoading(true);
        // We pass list_type so the backend sorts accordingly
        const res = await getProducts({ per_page: 8, list_type: listType });
        const items = res.data?.data || res.data || [];
        setProducts(items);
      } catch (error) {
        console.error('Error fetching dynamic carousel products', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCarouselProducts();
  }, [listType]);

  const scrollLeft = () => {
    const el = document.getElementById('dynamic-carousel-scroll');
    if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const el = document.getElementById('dynamic-carousel-scroll');
    if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <section className="dyn-carousel-section">
        <div className="dyn-carousel-container" style={{ minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#666', letterSpacing: '2px' }}>CARGANDO PRODUCTOS...</p>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="dyn-carousel-section">
      <div className="dyn-carousel-container">
        
        <div className="dyn-carousel-header">
          <h2 className="dyn-carousel-title">{title}</h2>
          
          <div className="dyn-carousel-controls">
            <button onClick={scrollLeft} className="dyn-carousel-btn" aria-label="Anterior">
              <ArrowLeft size={20} />
            </button>
            <button onClick={scrollRight} className="dyn-carousel-btn" aria-label="Siguiente">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <div className="dyn-carousel-scroll" id="dynamic-carousel-scroll">
          {products.map(product => {
            const mainImg = product.product_images?.find(i => i.is_main) || product.product_images?.[0];
            const imgUrl = mainImg ? getImageUrl(mainImg.url) : FALLBACK_IMAGE;
            const price = product.discounted_price || product.base_price;
            
            return (
              <Link to={`/shop/catalog/${product.slug || product.id}`} key={product.id} className="dyn-product-card">
                <div className="dyn-product-image">
                  <img 
                    src={imgUrl} 
                    alt={product.name} 
                    loading="lazy"
                    onError={(e) => { e.target.src = FALLBACK_IMAGE; e.target.onerror = null; }}
                  />
                  {product.has_discount && (
                    <div className="dyn-product-badge">
                      {product.discount_label}
                    </div>
                  )}
                </div>
                <div className="dyn-product-info">
                  <h3 className="dyn-product-name">{product.name}</h3>
                  <div className="dyn-product-prices">
                    {product.has_discount && (
                      <span className="dyn-price-original">Bs {product.base_price}</span>
                    )}
                    <span className="dyn-price-current">Bs {price}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <Link to="/shop/catalog" className="dyn-carousel-view-all">
            VER CATÁLOGO COMPLETO
          </Link>
        </div>

      </div>
    </section>
  );
}
