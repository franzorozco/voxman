import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../../../api/shop/products';
import { API_BASE_URL } from '../../../config/api';
import './Home.css';

const Home = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef(null);

  // Scroll-reveal: observar items DESPUÉS de que se rendericen
  useEffect(() => {
    if (images.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('shop-collage-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );

    const el = gridRef.current;
    if (el) {
      const items = el.querySelectorAll('.shop-collage-item');
      items.forEach((item, i) => {
        item.style.transitionDelay = `${(i % 8) * 0.08}s`;
        observer.observe(item);
      });
    }

    return () => observer.disconnect();
  }, [images]);

  useEffect(() => {
    fetchCollageImages();
  }, []);

  const fetchCollageImages = async () => {
    try {
      const res = await getProducts({ per_page: 50 });
      const products = res.data.data || [];
      const collageItems = [];

      products.forEach((product) => {
        // 1. Imágenes por color (attribute_value_images) — las principales
        const colorImages = (product.attribute_value_images || [])
          .filter(img => img.is_main)
          .map(img => ({
            id: img.id,
            url: img.url,
            productName: product.name,
            productSlug: product.slug || product.id,
            colorName: img.attribute_value?.value || '',
            price: product.base_price,
          }));

        if (colorImages.length > 0) {
          collageItems.push(...colorImages);
        } else {
          // 2. Imágenes por variante única (variant_images) — primera de cada variante
          const variantImages = [];
          const seenAttrs = new Set();
          (product.product_variants || []).forEach(variant => {
            if (variant.variant_images && variant.variant_images.length > 0) {
              // Crear clave única con los atributos de la variante (ej: "Negro" o "Negro|M")
              const attrKey = (variant.variant_attribute_values || [])
                .map(va => va.attribute_value?.value || '')
                .sort()
                .join('|') || variant.id;

              if (!seenAttrs.has(attrKey)) {
                seenAttrs.add(attrKey);
                const firstImg = variant.variant_images[0];
                variantImages.push({
                  id: firstImg.id,
                  url: firstImg.url,
                  productName: product.name,
                  productSlug: product.slug || product.id,
                  colorName: '',
                  price: variant.price || product.base_price,
                });
              }
            }
          });

          if (variantImages.length > 0) {
            collageItems.push(...variantImages);
          } else {
            // 3. Imágenes generales del producto (product_images) — la principal
            const mainImg = (product.product_images || []).find(img => img.is_main);
            if (mainImg) {
              collageItems.push({
                id: mainImg.id,
                url: mainImg.url,
                productName: product.name,
                productSlug: product.slug || product.id,
                colorName: '',
                price: product.base_price,
              });
            } else if (product.product_images?.length > 0) {
              // Fallback: primera imagen disponible
              collageItems.push({
                id: product.product_images[0].id,
                url: product.product_images[0].url,
                productName: product.name,
                productSlug: product.slug || product.id,
                colorName: '',
                price: product.base_price,
              });
            }
          }
        }
      });

      // Mezclar aleatoriamente (Fisher-Yates)
      for (let i = collageItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [collageItems[i], collageItems[j]] = [collageItems[j], collageItems[i]];
      }

      // Insertar video en posición aleatoria
      const videoItem = {
        id: 'video-short-1',
        url: '/storage/short/poleras_aelatori.mp4',
        productName: '',
        productSlug: 'catalog',
        colorName: '',
        price: null,
        type: 'video',
      };
      const videoPos = Math.floor(Math.random() * (collageItems.length + 1));
      collageItems.splice(videoPos, 0, videoItem);

      setImages(collageItems);
    } catch (err) {
      console.error('Error fetching collage images:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  if (loading) {
    return (
      <div className="shop-home-loading">
        <div className="shop-home-loader" />
      </div>
    );
  }

  return (
    <div className="shop-home">
      <div className="shop-collage-grid" ref={gridRef}>
        {images.map((item, index) => (
          <Link
            key={item.id || index}
            to={`/shop/product/${item.productSlug}`}
            className={`shop-collage-item ${
              item.type === 'video' ? 'shop-collage-tall' :
              index % 7 === 0 ? 'shop-collage-large' :
              index % 5 === 0 ? 'shop-collage-tall' :
              index % 4 === 0 ? 'shop-collage-wide' : ''
            }`}
          >
            {item.type === 'video' ? (
              <video
                src={getImageUrl(item.url)}
                className="shop-collage-img"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={getImageUrl(item.url)}
                alt={item.productName}
                className="shop-collage-img"
                loading="lazy"
              />
            )}
            {item.productName && (
            <div className="shop-collage-overlay">
              <div className="shop-collage-info">
                <span className="shop-collage-name">{item.productName}</span>
                {item.colorName && (
                  <span className="shop-collage-color">{item.colorName}</span>
                )}
                {item.price && (
                <span className="shop-collage-price">
                  Bs. {Number(item.price).toFixed(2)}
                </span>
                )}
              </div>
            </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
