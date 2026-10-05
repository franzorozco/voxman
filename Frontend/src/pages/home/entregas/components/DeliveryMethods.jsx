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
        features: "Entregas en 24h a 48h hÃ¡biles.\nPago contra entrega disponible."
      },
      {
        title: settings.shipping_opt2_title || "EnvÃ­os Nacionales",
        desc: settings.shipping_opt2_desc || "Llegamos a los 9 departamentos de Bolivia mediante flotas seguras y empresas de courier de confianza.",
        icon: "Truck",
        features: "Despachos en 24h hÃ¡biles.\nEmpaque premium y seguro."
      }
    ];
  }

  const sectionOverline = settings.shipping_methods_overline || "Nuestras Rutas";
  const sectionTitle = settings.shipping_methods_title || "Opciones de Entrega";
  const sectionSubtitle = settings.shipping_methods_subtitle || "DiseÃ±adas para adaptarse a tu ritmo y a tu ubicaciÃ³n.";
  const cardAnimation = settings.shipping_methods_animation || "fade-up";

  const renderIcon = (name, size) => {
    const IconCmp = Icons[name] || Icons.CheckCircle;
    return <IconCmp size={size} strokeWidth={1.5} />;
  };

  const getRevealClass = (index, animType) => {
    if (animType === "fade-left") return "vox-reveal-left";
    if (animType === "fade-right") return "vox-reveal-right";
    if (animType === "fade-up") return "vox-reveal";
    if (animType === "alternate") return index % 2 !== 0 ? "vox-reveal-right" : "vox-reveal-left";
    return "vox-reveal";
  };

  return (
    <section className="vox-delivery-methods">
      <div className="vox-container">
        <div className="vox-section-header vox-reveal">
          {sectionOverline && <span className="vox-overline">{sectionOverline}</span>}
          {sectionTitle && <h2 className="vox-section-title">{sectionTitle}</h2>}
          {sectionSubtitle && <p className="vox-section-subtitle">{sectionSubtitle}</p>}
        </div>

        <div className="vox-delivery-grid">
          {methods.map((method, i) => {
            const delayClass = i % 2 !== 0 ? "delay-1" : "";
            const revealClass = getRevealClass(i, cardAnimation);
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
