import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../../../api/shop/products';
import { getActiveShorts } from '../../../api/shop/shorts';
import { API_BASE_URL } from '../../../config/api';
import { VideoPlayer } from '../../../utils/videoHelpers';
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
    fetchCollageItems();
  }, []);

  const fetchCollageItems = async () => {
    try {
      // Fetch both products and active shorts
      const [productsRes, shortsRes] = await Promise.all([
        getProducts({ per_page: 50 }),
        getActiveShorts()
      ]);
      
      const products = productsRes.data.data || [];
      const shorts = shortsRes.data || [];
      const collageItems = [];

      // 1. Procesar Productos
      products.forEach((product) => {
        // Imágenes por color (attribute_value_images) — las principales
        const colorImages = (product.attribute_value_images || [])
          .filter(img => img.is_main)
          .map(img => ({
            id: img.id,
            url: img.url,
            productName: product.name,
            targetUrl: `/shop/product/${product.slug || product.id}`,
            colorName: img.attribute_value?.value || '',
            price: product.base_price,
            type: 'image'
          }));

        if (colorImages.length > 0) {
          collageItems.push(...colorImages);
        } else {
          // Imágenes por variante única (variant_images) — primera de cada variante deduped by attrs
          const variantImages = [];
          const seenAttrs = new Set();
          (product.product_variants || []).forEach(variant => {
            if (variant.variant_images && variant.variant_images.length > 0) {
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
                  targetUrl: `/shop/product/${product.slug || product.id}`,
                  colorName: '',
                  price: variant.price || product.base_price,
                  type: 'image'
                });
              }
            }
          });

          if (variantImages.length > 0) {
            collageItems.push(...variantImages);
          } else {
            // Imágenes generales del producto (product_images) — la principal
            const mainImg = (product.product_images || []).find(img => img.is_main);
            if (mainImg) {
              collageItems.push({
                id: mainImg.id,
                url: mainImg.url,
                productName: product.name,
                targetUrl: `/shop/product/${product.slug || product.id}`,
                colorName: '',
                price: product.base_price,
                type: 'image'
              });
            } else if (product.product_images?.length > 0) {
              // Fallback: primera imagen disponible
              collageItems.push({
                id: product.product_images[0].id,
                url: product.product_images[0].url,
                productName: product.name,
                targetUrl: `/shop/product/${product.slug || product.id}`,
                colorName: '',
                price: product.base_price,
                type: 'image'
              });
            }
          }
        }
      });

      // 2. Mezclar productos aleatoriamente (Fisher-Yates)
      for (let i = collageItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [collageItems[i], collageItems[j]] = [collageItems[j], collageItems[i]];
      }

      // 2b. Separar variantes del mismo producto para que no queden juntas
      for (let i = 1; i < collageItems.length; i++) {
        if (
          collageItems[i].targetUrl === collageItems[i - 1].targetUrl ||
          (i > 1 && collageItems[i].targetUrl === collageItems[i - 2].targetUrl)
        ) {
          let swapIdx = -1;
          for (let j = i + 1; j < collageItems.length; j++) {
            if (
              collageItems[j].targetUrl !== collageItems[i - 1].targetUrl &&
              (i > 1 ? collageItems[j].targetUrl !== collageItems[i - 2].targetUrl : true) &&
              (j < collageItems.length - 1 ? collageItems[i].targetUrl !== collageItems[j + 1].targetUrl : true)
            ) {
              swapIdx = j;
              break;
            }
          }
          if (swapIdx !== -1) {
            [collageItems[i], collageItems[swapIdx]] = [collageItems[swapIdx], collageItems[i]];
          }
        }
      }

      // 3. Procesar e insertar Shorts basados en su prioridad y mantenerlos separados
      const formattedShorts = shorts.map(s => {
        let targetUrl = '/shop';
        if (s.product) {
          targetUrl = `/shop/product/${s.product.slug || s.product.id}`;
        } else if (s.category) {
          targetUrl = `/shop?category=${s.category.slug || s.category.id}`;
        }

        return {
          id: s.id,
          url: s.video_url,
          productName: s.title || '',
          targetUrl: targetUrl,
          colorName: '',
          price: s.product ? s.product.base_price : null,
          type: 'video',
          priority: s.priority
        };
      });

      // Ordenar de mayor a menor prioridad para insertar los mejores primero
      formattedShorts.sort((a, b) => b.priority - a.priority);

      const videoIndices = [];
      const MIN_VIDEO_GAP = 5; // Distancia mínima de 5 items entre videos

      formattedShorts.forEach((short) => {
        let insertIndex;
        let attempts = 0;
        let maxPos = short.priority > 0 
          ? Math.max(1, Math.floor(collageItems.length / Math.max(1, short.priority))) 
          : collageItems.length;

        do {
          insertIndex = Math.floor(Math.random() * maxPos);
          let isValid = true;
          for (let vIdx of videoIndices) {
             if (Math.abs(vIdx - insertIndex) < MIN_VIDEO_GAP) {
                isValid = false;
                break;
             }
          }
          if (isValid) break;
          attempts++;
          if (attempts > 5) maxPos = Math.min(collageItems.length, maxPos + 3);
        } while (attempts < 20);

        collageItems.splice(insertIndex, 0, short);
        
        for (let i = 0; i < videoIndices.length; i++) {
           if (videoIndices[i] >= insertIndex) videoIndices[i]++;
        }
        videoIndices.push(insertIndex);
      });

      setImages(collageItems);
    } catch (err) {
      console.error('Error fetching collage items:', err);
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
            to={item.targetUrl}
            className={`shop-collage-item ${
              item.type === 'video' ? 'shop-collage-tall' :
              index % 7 === 0 ? 'shop-collage-large' :
              index % 5 === 0 ? 'shop-collage-tall' :
              index % 4 === 0 ? 'shop-collage-wide' : ''
            }`}
          >
            {item.type === 'video' ? (
              <VideoPlayer
                url={item.url}
                className="shop-collage-img"
                autoPlay={true}
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
