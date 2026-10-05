import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getImageUrl } from '../../../utils/imageUtils';
import './ShopFeaturedCategories.css';

const FALLBACK_IMAGE = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/image_not_found_white.jfif";

export default function ShopFeaturedCategories({ categories }) {
  let parsedCats = [];
  
  if (categories) {
    try {
      parsedCats = typeof categories === 'string' ? JSON.parse(categories) : categories;
    } catch {
      parsedCats = [];
    }
  }

  if (!parsedCats || parsedCats.length === 0) return null;

  return (
    <section className="shop-fc-section">
      <div className="shop-fc-header">
        <h2 className="shop-fc-title">CATEGORÃAS DESTACADAS</h2>
        <Link to="/shop/catalog" className="shop-fc-link">
          VER TODO <ArrowRight size={16} />
        </Link>
      </div>

      <div className="shop-fc-grid">
        {parsedCats.map(cat => (
          <Link to={`/shop/catalog?category=${cat.id}`} key={cat.id} className="shop-fc-card">
            <img 
              src={cat.image ? getImageUrl(cat.image) : FALLBACK_IMAGE} 
              alt={cat.name} 
              loading="lazy"
              className="shop-fc-image"
              onError={(e) => { e.target.src = FALLBACK_IMAGE; e.target.onerror = null; }}
            />
            <div className="shop-fc-overlay">
              <span className="shop-fc-name">{cat.name}</span>
              <span className="shop-fc-btn">EXPLORAR <ArrowRight size={14} /></span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
