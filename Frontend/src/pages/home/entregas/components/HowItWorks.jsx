import React from "react";
import { useShopSettingsStore } from "../../../../store/shop/useShopSettingsStore";

export default function HowItWorks() {
  const { settings } = useShopSettingsStore();

  let steps = [];
  try {
    steps = settings.shipping_process_steps ? JSON.parse(settings.shipping_process_steps) : [];
  } catch (e) {
    steps = [];
  }

  // Fallback
  if (steps.length === 0) {
    steps = [
      { title: "Eliges y Confirmas", desc: "Realizas tu pedido a través de nuestra web o WhatsApp. Te confirmamos el stock inmediatamente." },
      { title: "Empaque y Preparación", desc: "Preparamos tu orden con nuestra firma de empaque premium, asegurando que tu prenda llegue impecable." },
      { title: "Despacho y Seguimiento", desc: "Coordinamos la entrega o realizamos el envío nacional. Te enviamos la guía o el comprobante para que sepas dónde está tu compra." }
    ];
  }

  const sectionOverline = settings.shipping_process_overline || "Paso a Paso";
  const sectionTitle = settings.shipping_process_title || "¿Cómo es el proceso?";
  const layout = settings.shipping_process_layout || "list";
  const animation = settings.shipping_process_animation || "fade-left";

  const getRevealClass = (index, animType) => {
    if (animType === "fade-left") return "vox-reveal-left";
    if (animType === "fade-right") return "vox-reveal-right";
    if (animType === "fade-up") return "vox-reveal";
    if (animType === "alternate") return index % 2 !== 0 ? "vox-reveal-right" : "vox-reveal-left";
    return "vox-reveal-left";
  };

  const containerClass = layout === "cards" ? "vox-process-cards" : "vox-steps";

  return (
    <section className="vox-how-it-works">
      <div className="vox-container">
        <div className={`vox-how-grid ${layout === 'cards' ? 'layout-cards' : ''}`}>
          <div className={`vox-how-text ${getRevealClass(0, animation)}`}>
            {sectionOverline && <span className="vox-overline">{sectionOverline}</span>}
            {sectionTitle && <h2 className="vox-section-title">{sectionTitle}</h2>}
            
            <div className={containerClass}>
              {steps.map((step, i) => {
                const delayClass = i % 2 !== 0 ? "delay-1" : "";
                const stepReveal = getRevealClass(i + 1, animation);
                
                return (
                  <div className={`vox-step ${stepReveal} ${delayClass}`} key={i}>
                    <div className="vox-step-number">{String(i + 1).padStart(2, '0')}</div>
                    <div className="vox-step-info">
                      <h4>{step.title}</h4>
                      <p>{step.desc}</p>
                      {step.link_text && step.link_url && (
                        <a href={step.link_url} target="_blank" rel="noopener noreferrer" className="vox-step-link">
                          {step.link_text}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
