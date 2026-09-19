import React, { useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { useShopSettingsStore } from '../../../store/shop/useShopSettingsStore';
import './ValueProps.css';

const DEFAULT_PROPS = [
  {
    icon: 'MessageCircle',
    title: 'Contacto Directo',
    desc: 'Coordina tu entrega de forma rápida sin registros obligatorios.'
  },
  {
    icon: 'Truck',
    title: 'Envíos y Delivery',
    desc: 'Entregas en La Paz, El Alto, Zona Sur, y envíos seguros a nivel nacional.'
  },
  {
    icon: 'PackageCheck',
    title: 'Reservas Flexibles',
    desc: 'Asegura tu pedido con un adelanto y coordina fecha, hora y lugar.'
  },
  {
    icon: 'UserPlus',
    title: 'Ventajas Exclusivas',
    desc: 'Crea tu cuenta (opcional) para agilizar envíos y guardar direcciones.'
  }
];

import { getImageUrl } from '../../../utils/imageUtils';

export default function ValueProps() {
  const { settings } = useShopSettingsStore();
  const rightRef = useRef(null);

  const propsData = (() => {
    try {
      if (!settings.home_value_props) return DEFAULT_PROPS;
      const parsed = JSON.parse(settings.home_value_props);
      return parsed.length > 0 ? parsed : DEFAULT_PROPS;
    } catch {
      return DEFAULT_PROPS;
    }
  })();

  useEffect(() => {
    const handleScroll = () => {
      if (!rightRef.current) return;
      const rect = rightRef.current.getBoundingClientRect();
      
      // Perfectly center the active card, adjust for mobile to lower it
      const isMobile = window.innerWidth <= 800;
      const start = isMobile ? window.innerHeight * 0.40 : (window.innerHeight / 2) - 150; 
      let scrolled = start - rect.top;
      if (scrolled < 0) scrolled = 0;

      const distance = 400; // Pixels to scroll for one card to drop
      const maxDrops = propsData.length - 1;

      let p1 = maxDrops >= 1 ? Math.min(Math.max(scrolled / distance, 0), 1) : 0;
      let p2 = maxDrops >= 2 ? Math.min(Math.max((scrolled - distance) / distance, 0), 1) : 0;
      let p3 = maxDrops >= 3 ? Math.min(Math.max((scrolled - distance * 2) / distance, 0), 1) : 0;

      rightRef.current.style.setProperty('--p1', p1);
      rightRef.current.style.setProperty('--p2', p2);
      rightRef.current.style.setProperty('--p3', p3);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [propsData.length]);

  // Calculate dynamic height based on actual number of cards
  // Reduced to 300px (approx card height) to completely eliminate dead scroll
  const scrollHeight = `calc(300px + ${Math.max(0, propsData.length - 1) * 400}px)`;

  const bgImage = settings.home_value_props_bg || null;
  const isMobileInitial = typeof window !== 'undefined' && window.innerWidth <= 800;
  const sectionStyle = bgImage ? {
    backgroundImage: `linear-gradient(to bottom right, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.65)), url(${getImageUrl(bgImage)})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: isMobileInitial ? 'scroll' : 'fixed'
  } : {};

  return (
    <section className="vp-section" style={sectionStyle}>
      <div className="vp-container">
        
        <div className="vp-left">
          <h4 className="vp-subtitle">La Experiencia VØXman</h4>
          <h2 className="vp-title">COMPRAS SIN FRICCIÓN.</h2>
          <p className="vp-desc">
            Nos adaptamos a ti. Olvídate de los procesos automatizados y fríos. 
            Disfruta de una atención humana, directa y a tu medida, desde el primer 
            contacto hasta que la prenda está en tus manos.
          </p>
        </div>

        <div className="vp-right" ref={rightRef} style={{ minHeight: scrollHeight }}>
          <div className="vp-sticky-zone">
            {propsData.map((item, index) => {
              const IconComponent = Icons[item.icon] || Icons.HelpCircle;
              const number = String(index + 1).padStart(2, '0');
              return (
                <div key={index} className={`vp-card card-idx-${index}`} style={{ zIndex: 10 - index }}>
                  <div className="vp-card-watermark">{number}</div>
                  <div className="vp-icon-wrapper">
                    <IconComponent size={32} strokeWidth={1.5} />
                  </div>
                  <h3 className="vp-card-title">{item.title}</h3>
                  <p className="vp-card-desc">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
