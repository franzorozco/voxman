import React from "react";
import * as Icons from "lucide-react";
import { useShopSettingsStore } from "../../../../store/shop/useShopSettingsStore";

export default function DeliveryMethods() {
  const { settings } = useShopSettingsStore();

  let methods = [];
  let debugError = null;
  try {
    methods = settings.shipping_delivery_methods ? JSON.parse(settings.shipping_delivery_methods) : [];
  } catch (e) {
    console.error("Error parseando methods:", e, settings.shipping_delivery_methods);
    debugError = e.toString();
    methods = [];
  }

  // Fallback if empty (for backward compatibility during migration)
  if (methods.length === 0) {
    methods = [
      {
        title: settings.shipping_opt1_title || "La Paz y El Alto",
        desc: settings.shipping_opt1_desc || "Entregas personales y coordinadas. Nos adaptamos a tus horarios y definimos un punto de encuentro o entrega a domicilio.",
        icon: "MapPin",
        features: "Entregas en 24h a 48h hábiles.\nPago contra entrega disponible."
      },
      {
        title: settings.shipping_opt2_title || "Envíos Nacionales",
        desc: settings.shipping_opt2_desc || "Llegamos a los 9 departamentos de Bolivia mediante flotas seguras y empresas de courier de confianza.",
        icon: "Truck",
        features: "Despachos en 24h hábiles.\nEmpaque premium y seguro."
      }
    ];
  }

  const renderIcon = (name, size) => {
    const IconCmp = Icons[name] || Icons.CheckCircle;
    return <IconCmp size={size} strokeWidth={1.5} />;
  };

  return (
    <section className="vox-delivery-methods">
      <div className="vox-container">
        <div className="vox-section-header vox-reveal">
          <span className="vox-overline">Nuestras Rutas</span>
          <h2 className="vox-section-title">Opciones de Entrega</h2>
          <p className="vox-section-subtitle">Diseñadas para adaptarse a tu ritmo y a tu ubicación.</p>
        </div>

        <div className="vox-delivery-grid">
          {methods.map((method, i) => {
            const delayClass = i % 2 !== 0 ? "delay-1" : "";
            const revealClass = i % 2 !== 0 ? "vox-reveal-right" : "vox-reveal-left";
            const featureList = method.features ? method.features.split('\n').filter(f => f.trim() !== '') : [];

            return (
              <div key={i} className={`vox-delivery-card ${revealClass} ${delayClass}`}>
                <div className="vox-card-icon">
                  {renderIcon(method.icon || "MapPin", 32)}
                </div>
                <h3>{method.title}</h3>
                <p className="vox-card-desc">{method.desc}</p>
                {featureList.length > 0 && (
                  <ul className="vox-card-list">
                    {featureList.map((f, j) => (
                      <li key={j}>
                        <Icons.CheckCircle size={16} /> {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
