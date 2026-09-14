import React from 'react';
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

export default function ValueProps() {
  const { settings } = useShopSettingsStore();

  const propsData = (() => {
    try {
      if (!settings.home_value_props) return DEFAULT_PROPS;
      const parsed = JSON.parse(settings.home_value_props);
      return parsed.length > 0 ? parsed : DEFAULT_PROPS;
    } catch {
      return DEFAULT_PROPS;
    }
  })();

  return (
    <section className="vp-section">
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

        <div className="vp-right">
          {propsData.map((item, index) => {
            const IconComponent = Icons[item.icon] || Icons.HelpCircle;
            const number = String(index + 1).padStart(2, '0');
            return (
              <div key={index} className="vp-card">
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
    </section>
  );
}
