import { getImageUrl } from '../../../utils/imageUtils';
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../../config/api';
import { VideoPlayer } from '../../../components/ui/videoHelpers';
import '../Home/Home.css'; // Reusing the same CSS for the collage grid

const ShopCollageGrid = ({ items }) => {
  const gridRef = useRef(null);

  // Scroll-reveal: observe items AFTER they render
  useEffect(() => {
    if (!items || items.length === 0) return;

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
      const domItems = el.querySelectorAll('.shop-collage-item');
      domItems.forEach((item, i) => {
        item.style.transitionDelay = `${(i % 8) * 0.08}s`;
        observer.observe(item);
      });
    }

    return () => observer.disconnect();
  }, [items]);

  

  if (!items || items.length === 0) {
    return (
      <div className="shop-home-loading">
        <p style={{ color: 'var(--text-muted)' }}>No se encontraron elementos.</p>
      </div>
    );
  }

  return (
    <div className="shop-collage-grid" ref={gridRef}>
      {items.map((item, index) => (
        <Link 
          key={item.id || index} 
          to={item.targetUrl}
          className={`shop-collage-item ${
            item.type === 'video' ? 'shop-collage-tall' :
            index % 7 === 0 ? 'shop-collage-large' :
            index % 5 === 0 ? 'shop-collage-tall' : ''
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

          <div className="shop-collage-overlay">
            <div className="shop-collage-info">
              <span className="shop-collage-name">{item.productName}</span>
              {item.colorName && (
                <span className="shop-collage-color">{item.colorName}</span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ShopCollageGrid;
