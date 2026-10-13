import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../../utils/imageUtils';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    const timer = setTimeout(checkScroll, 350);

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      clearTimeout(timer);
    };
  }, [checkScroll, products]);

  if (!products || products.length === 0) return null;

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const firstCard = container.querySelector('.carousel-item');
    const scrollAmount = firstCard ? firstCard.offsetWidth + 16 : 300;

    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const hasCardStyle = String(cardShadow) === "1" || (cardBg && cardBg !== 'transparent');

  return (
    <section className="new-arrivals-section">
      <div className="new-arrivals-header">
        <div className="new-arrivals-title-group">
          <h2 className="new-arrivals-title">{title || "NOVEDADES"}</h2>
          {subtitle && <p className="new-arrivals-subtitle">{subtitle}</p>}
        </div>

        <Link to="/shop/catalog" className="new-arrivals-link" aria-label="Ver todas las novedades en el catálogo">
          <span className="new-arrivals-link-text">Ver Todo</span>
          <ArrowRight size={16} className="new-arrivals-link-icon" />
        </Link>
      </div>
      
      <div className="new-arrivals-carousel-wrapper">
        <button 
          type="button"
          className={`carousel-arrow-btn carousel-arrow-prev ${!canScrollLeft ? 'is-hidden' : ''}`}
          onClick={() => scroll('left')}
          aria-label="Ver productos anteriores"
          disabled={!canScrollLeft}
        >
          <ChevronLeft size={20} />
        </button>

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

        <button 
          type="button"
          className={`carousel-arrow-btn carousel-arrow-next ${!canScrollRight ? 'is-hidden' : ''}`}
          onClick={() => scroll('right')}
          aria-label="Ver productos siguientes"
          disabled={!canScrollRight}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
};

export default NewArrivalsCarousel;
