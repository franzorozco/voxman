import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../../utils/imageUtils';
import './NewArrivalsCarousel.css';

const NewArrivalsCarousel = ({ products }) => {
  const scrollRef = useRef(null);

  if (!products || products.length === 0) return null;

  return (
    <div className="new-arrivals-section">
      <div className="new-arrivals-header">
        <h2 className="new-arrivals-title">NOVEDADES</h2>
        <Link to="/shop/catalog" className="new-arrivals-link">Ver Todo</Link>
      </div>
      
      <div className="new-arrivals-carousel" ref={scrollRef}>
        {products.map((item, index) => (
          <Link key={item.id || index} to={item.targetUrl} className="carousel-item">
            <div className="carousel-item-img-wrapper" style={{ position: 'relative' }}>
              <img 
                src={getImageUrl(item.url)} 
                alt={item.productName} 
                className="carousel-item-img" 
                loading="lazy" 
              />
            </div>
            <div className="carousel-item-info">
              <span className="carousel-item-name">{item.productName}</span>
              <span className="carousel-item-price">Bs. {Number(item.price).toFixed(2)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NewArrivalsCarousel;
