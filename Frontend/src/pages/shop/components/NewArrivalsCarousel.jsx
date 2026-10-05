import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../../utils/imageUtils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './NewArrivalsCarousel.css';

const NewArrivalsCarousel = ({ 
  products, 
  title, 
  subtitle, 
  cardBg, 
  textColor, 
  cardRadius, 
  cardShadow 
}) => {
  const scrollRef = useRef(null);

  if (!products || products.length === 0) return null;

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
  };

  const hasCardStyle = String(cardShadow) === "1" || (cardBg && cardBg !== 'transparent');

  return (
    <div className="new-arrivals-section" style={{ position: 'relative' }}>
      <div className="new-arrivals-header">
        <div>
          <h2 className="new-arrivals-title">{title || "NOVEDADES"}</h2>
          {subtitle && <p className="new-arrivals-subtitle" style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="new-arrivals-nav-buttons" style={{ display: 'flex', gap: '8px' }}>
            <button onClick={scrollLeft} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={scrollRight} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
              <ChevronRight size={18} />
            </button>
          </div>
          <Link to="/shop/catalog" className="new-arrivals-link">Ver Todo</Link>
        </div>
      </div>
      
      <div className="new-arrivals-carousel" ref={scrollRef}>
        {products.map((item, index) => (
          <Link 
            key={item.id || index} 
            to={item.targetUrl} 
            className="carousel-item"
            style={{
              backgroundColor: cardBg || 'transparent',
              borderRadius: cardRadius ? `${cardRadius}px` : '0px',
              boxShadow: String(cardShadow) === "1" ? '0 4px 15px rgba(0,0,0,0.1)' : 'none',
              overflow: 'hidden',
              paddingBottom: hasCardStyle ? '16px' : '0'
            }}
          >
            <div className="carousel-item-img-wrapper" style={{ position: 'relative', marginBottom: hasCardStyle ? '12px' : '12px' }}>
              <img 
                src={getImageUrl(item.url)} 
                alt={item.productName} 
                className="carousel-item-img" 
                loading="lazy" 
              />
            </div>
            <div className="carousel-item-info" style={{ padding: hasCardStyle ? '0 16px' : '0' }}>
              <span className="carousel-item-name" style={{ color: textColor || 'var(--text-main)' }}>{item.productName}</span>
              <span className="carousel-item-price" style={{ color: textColor || 'var(--text-main)', opacity: 0.9 }}>Bs. {Number(item.price).toFixed(2)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NewArrivalsCarousel;
