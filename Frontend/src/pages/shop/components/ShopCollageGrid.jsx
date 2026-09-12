import { getImageUrl } from '../../../utils/imageUtils';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../../config/api';
import { VideoPlayer } from '../../../components/ui/videoHelpers';
import '../Home/Home.css'; // Reusing the same CSS for the collage grid

const ShopCollageGrid = ({ items }) => {
  const gridRef = useRef(null);
  const [columns, setColumns] = useState(4);

  // Track window size to determine grid columns
  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth <= 480) setColumns(1);
      else if (window.innerWidth <= 768) setColumns(2);
      else if (window.innerWidth <= 1024) setColumns(3);
      else setColumns(4);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Pure CSS animation is now used instead of IntersectionObserver


  if (!items || items.length === 0) {
    return (
      <div className="shop-home-loading">
        <p style={{ color: 'var(--text-muted)' }}>No se encontraron elementos.</p>
      </div>
    );
  }

  // Generate layout items with specific classes based on index
  const layoutItems = [];
  let totalArea = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let type = '';
    let area = 1;

    // We avoid placing large/tall items near the very end to guarantee clean packing
    const isNearEnd = i >= items.length - 6;

    if (columns > 1 && !isNearEnd) {
      if (item.type === 'video') {
        type = 'shop-collage-tall';
        area = 2;
      } else if (i % 7 === 0) {
        type = 'shop-collage-large';
        area = 4;
      } else if (i % 5 === 0) {
        type = 'shop-collage-tall';
        area = 2;
      }
    }

    layoutItems.push({ ...item, cssClass: type, area });
    totalArea += area;
  }

  // Trim from the end so that the total area exactly fills the columns without leaving gaps
  // AND limit the height to a maximum of 5 rows.
  const MAX_ROWS = 5;
  const maxArea = MAX_ROWS * columns;

  while (layoutItems.length > 0 && (totalArea > maxArea || totalArea % columns !== 0)) {
    const last = layoutItems.pop();
    totalArea -= last.area;
  }

  return (
    <div className="shop-collage-grid" ref={gridRef}>
      {layoutItems.map((item, index) => (
        <Link 
          key={item.id || index} 
          to={item.targetUrl}
          className={`shop-collage-item ${item.cssClass}`}
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
              <span className="shop-collage-action">Explorar</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ShopCollageGrid;
