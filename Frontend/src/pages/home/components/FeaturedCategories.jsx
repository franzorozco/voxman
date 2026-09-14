import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getFeaturedCategories } from '../../../api/shop/categories';
import { getImageUrl } from '../../../utils/imageUtils';
import './FeaturedCategories.css';

const FALLBACK_IMAGE = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/image_not_found_black.jfif";

export default function FeaturedCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getFeaturedCategories();
        // res.data is assumed if using axios, but if api.get directly returns the data, we handle it:
        setCategories(res.data || res);
      } catch (error) {
        console.error('Error fetching featured categories', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  if (loading) return null; // Or a minimalist skeleton loader
  if (categories.length === 0) return null; // Don't show section if empty

  return (
    <section className="fc-section">
      <div className="fc-container">
        
        <div className="fc-header">
          <h2 className="fc-title">C A T E G O R Í A S</h2>
          <Link to="/catalog" className="fc-link-all">
            VER CATÁLOGO COMPLETO <ArrowRight size={16} />
          </Link>
        </div>

        <div className="fc-grid">
          {categories.map(cat => (
            <Link to={`/shop/catalog?category=${cat.id}`} key={cat.id} className="fc-card">
              <div className="fc-image-wrapper">
                <img 
                  src={cat.image ? getImageUrl(cat.image) : FALLBACK_IMAGE} 
                  alt={cat.name} 
                  loading="lazy" 
                  onError={(e) => { e.target.src = FALLBACK_IMAGE; e.target.onerror = null; }}
                />
                <div className="fc-overlay"></div>
              </div>
              <div className="fc-card-content">
                <h3>{cat.name}</h3>
                <span className="fc-btn">Explorar</span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}