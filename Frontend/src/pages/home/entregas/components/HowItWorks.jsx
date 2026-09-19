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

  return (
    <section className="vox-how-it-works">
      <div className="vox-container">
        <div className="vox-how-grid">
          <div className="vox-how-text vox-reveal-left">
            <span className="vox-overline">Paso a Paso</span>
            <h2 className="vox-section-title">¿Cómo es el proceso?</h2>
            <div className="vox-steps">
              {steps.map((step, i) => (
                <div className="vox-step" key={i}>
                  <div className="vox-step-number">{String(i + 1).padStart(2, '0')}</div>
                  <div className="vox-step-info">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
