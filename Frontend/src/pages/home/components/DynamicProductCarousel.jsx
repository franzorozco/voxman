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

  const carouselItems = React.useMemo(() => {
    const prendas = [];
    products.forEach((product) => {
      const attrImages = product.attribute_value_images || [];
      const mainColorImages = attrImages.filter(img => img.is_main);

      if (mainColorImages.length > 0) {
        mainColorImages.forEach(mainImg => {
          let matchedVariant = null;
          if (product.product_variants) {
            const colorVariants = product.product_variants.filter(v => 
              v.variant_attribute_values?.some(vav => vav.attribute_value_id === mainImg.attribute_value_id)
            );
            if (colorVariants.length > 0) {
              matchedVariant = colorVariants.reduce((best, curr) => 
                (curr.discounted_price < best.discounted_price) ? curr : best
              , colorVariants[0]);
            }
          }
          
          prendas.push({
            unique_id: `img-${mainImg.id}`,
            product_id: product.id,
            slug: product.slug || product.id,
            name: `${product.name} - ${mainImg.attribute_value?.value || ''}`,
            color: mainImg.attribute_value?.value || '',
            base_price: matchedVariant ? matchedVariant.base_price : product.base_price,
            discounted_price: matchedVariant ? matchedVariant.discounted_price : product.discounted_price,
            has_discount: matchedVariant ? matchedVariant.has_discount : product.has_discount,
            discount_label: matchedVariant ? matchedVariant.discount_label : product.discount_label,
            image: mainImg.url
          });
        });
      } else {
        const seenAttrs = new Set();
        let addedVariant = false;
        (product.product_variants || []).forEach(variant => {
          if (variant.variant_images && variant.variant_images.length > 0) {
            const attrKey = (variant.variant_attribute_values || [])
              .map(va => va.attribute_value?.value || '')
              .sort().join(' ') || variant.id;
            
            if (!seenAttrs.has(attrKey)) {
              seenAttrs.add(attrKey);
              addedVariant = true;
              prendas.push({
                unique_id: `var-${variant.variant_images[0] ? variant.variant_images[0].id : variant.id}`,
                product_id: product.id,
                slug: product.slug || product.id,
                name: `${product.name} ${attrKey ? '- ' + attrKey : ''}`,
                color: attrKey,
                base_price: variant.base_price || product.base_price,
                discounted_price: variant.discounted_price || product.discounted_price,
                has_discount: variant.has_discount || product.has_discount,
                discount_label: variant.discount_label || product.discount_label,
                image: variant.variant_images[0].url
              });
            }
          }
        });
        
        if (!addedVariant) {
          const imageUrl = product.cover_image || (product.product_images?.length > 0 ? product.product_images[0].url : null);
          if (imageUrl) {
            prendas.push({
              unique_id: `prod-${product.id}`,
              product_id: product.id,
              slug: product.slug || product.id,
              name: product.name,
              base_price: product.base_price,
              discounted_price: product.discounted_price,
              has_discount: product.has_discount,
              discount_label: product.discount_label,
              image: imageUrl
            });
          }
        }
      }
    });
    return prendas;
  }, [products]);

  if (loading) {
    return (
      <section className="dyn-carousel-section">
        <div className="dyn-carousel-container" style={{ minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#666', letterSpacing: '2px' }}>CARGANDO PRODUCTOS...</p>
        </div>
      </section>
    );
  }

  if (carouselItems.length === 0) return null;

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
          {carouselItems.map(item => {
            const imgUrl = item.image ? getImageUrl(item.image) : FALLBACK_IMAGE;
            const price = item.discounted_price || item.base_price;
            
            const linkUrl = `/shop/product/${item.slug || item.product_id}${item.color ? `?color=${encodeURIComponent(item.color)}` : ''}`;

            return (
              <Link to={linkUrl} key={item.unique_id} className="dyn-product-card">
                <div className="dyn-product-image">
                  <img 
                    src={imgUrl} 
                    alt={item.name} 
                    loading="lazy"
                    onError={(e) => { e.target.src = FALLBACK_IMAGE; e.target.onerror = null; }}
                  />
                  {item.has_discount && (
                    <div className="dyn-product-badge">
                      {item.discount_label}
                    </div>
                  )}
                </div>
                <div className="dyn-product-info">
                  <h3 className="dyn-product-name">{item.name}</h3>
                  <div className="dyn-product-prices">
                    {item.has_discount && (
                      <span className="dyn-price-original">Bs {item.base_price}</span>
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
