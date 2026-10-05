import { getImageUrl } from '../../../utils/imageUtils';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { VideoPlayer } from '../../../components/ui/videoHelpers';
import '../Home/Home.css';

/* ─────────────────────────────────────────────────────
   LÍMITES
   Móvil    → máx 10 filas  (2 cols × 10 = 20 celdas)
   Tablet   → máx 10 filas  (3 cols × 10 = 30 celdas)
   Desktop  → máx 10 filas  (4 cols × 10 = 40 celdas)

   Patrón móvil: [Normal][Normal] → [Wide 2×2] → repeat
   Cada ciclo ocupa 3 filas (1 + 2 del wide).
───────────────────────────────────────────────────── */
const MAX_ROWS    = 10;
const MOBILE_CYCLE = 3; // items por ciclo en móvil

/* Filtra items sin URL de imagen válida (evita celdas blancas) */
const hasValidMedia = (item) => {
  if (item.type === 'video') return !!(item.url);
  return !!(item.url && item.url.trim() !== '');
};

const ShopCollageGrid = ({ items }) => {
  const gridRef = useRef(null);
  const [columns, setColumns] = useState(4);

  /* ── Detección de ancho ── */
  useEffect(() => {
    const update = () => {
      if      (window.innerWidth <= 768)  setColumns(2);
      else if (window.innerWidth <= 1024) setColumns(3);
      else                                setColumns(4);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* ── Calcular items a mostrar ── */
  const displayedItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    /* 1. Filtrar items sin media válida → elimina celdas blancas */
    const valid = items.filter(hasValidMedia);

    const result  = [];
    const MAX_AREA = MAX_ROWS * columns; // celdas máximas
    let   totalArea = 0;

    if (columns === 2) {
      /* ── MÓVIL: patrón [N][N][Wide 2×2] ── */
      for (let i = 0; i < valid.length; i++) {
        const posInCycle = i % MOBILE_CYCLE;
        const isWide     = valid[i].type === 'video' || posInCycle === 2;
        const area       = isWide ? 4 : 1;

        /* Parar si agregar este item superaría el límite */
        if (totalArea + area > MAX_AREA) break;

        result.push({ ...valid[i], cssClass: isWide ? 'shop-collage-wide' : '', area });
        totalArea += area;
      }

      /* Recortar hasta que el total sea par → fila final siempre completa */
      while (result.length > 0 && totalArea % 2 !== 0) {
        totalArea -= result.pop().area;
      }

    } else {
      /* ── TABLET / DESKTOP: layout editorial ── */
      for (let i = 0; i < valid.length; i++) {
        const item = valid[i];
        let type = '', area = 1;
        const isNearEnd = i >= valid.length - 6;

        if (!isNearEnd) {
          if      (item.type === 'video') { type = 'shop-collage-tall';  area = 2; }
          else if (i % 7 === 0)          { type = 'shop-collage-large'; area = 4; }
          else if (i % 5 === 0)          { type = 'shop-collage-tall';  area = 2; }
        }

        if (totalArea + area > MAX_AREA) break;

        result.push({ ...item, cssClass: type, area });
        totalArea += area;
      }

      /* Garantizar llenado completo de la última fila */
      while (result.length > 0 && totalArea % columns !== 0) {
        totalArea -= result.pop().area;
      }
    }

    return result;
  }, [items, columns]);

  /* ── Estado vacío ── */
  if (!items || items.length === 0) {
    return (
      <div className="shop-home-loading">
        <p style={{ color: 'var(--text-muted)' }}>No se encontraron elementos.</p>
      </div>
    );
  }

  return (
    <div className="shop-collage-grid" ref={gridRef}>
      {displayedItems.map((item, index) => (
        <Link
          key={item.id ?? index}
          to={item.targetUrl}
          className={`shop-collage-item ${item.cssClass}`}
          onTouchStart={e => e.currentTarget.classList.add('is-touched')}
          onTouchEnd={e   => e.currentTarget.classList.remove('is-touched')}
          onTouchCancel={e => e.currentTarget.classList.remove('is-touched')}
        >
          {item.type === 'video' ? (
            <VideoPlayer
              url={item.url}
              className="shop-collage-img"
              autoPlay
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
