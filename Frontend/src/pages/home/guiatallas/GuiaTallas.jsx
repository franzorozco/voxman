import React, { useEffect } from "react";
import "./GuiaTallas.css";
import { useShopSettingsStore } from "../../../store/shop/useShopSettingsStore";

export default function GuiaTallas() {
  const { settings, fetchSettings, fetched } = useShopSettingsStore();

  useEffect(() => {
    if (!fetched) {
      fetchSettings();
    }
  }, [fetched, fetchSettings]);

  // Intersection Observer para las animaciones al hacer scroll
  useEffect(() => {
    const timer = setTimeout(() => {
      const elementos = document.querySelectorAll(".vox-reveal, .vox-reveal-left, .vox-reveal-right");

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("active");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
      );

      elementos.forEach((el) => observer.observe(el));
    }, 100);
    return () => clearTimeout(timer);
  }, [settings]);

  const title = settings.size_page_title ?? "GUÍA DE TALLAS";
  const subtitle = settings.size_page_subtitle ?? "Cada una de nuestras prendas tiene un corte y caída únicos según su diseño. A continuación, te mostramos cómo medimos nuestras prendas para que puedas compararlas con tu ropa favorita y encontrar tu fit ideal.";
  
  const garments = (() => {
    try {
      if (settings.size_page_garments) {
        return JSON.parse(settings.size_page_garments);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  })();

  const visibleGarments = garments.filter(g => g.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <main className="guia-tallas-page">
      <section className="guia-content-section">
        {/* HEADER */}
        <div className="guia-header vox-reveal">
          <h1 className="main-title">{title}</h1>
          <p className="main-subtitle">{subtitle}</p>
        </div>

        {/* CÓMO MEDIR */}
        <div className="como-medir-section vox-reveal">
          <div className="medicion-grid">
            {visibleGarments.map((g, idx) => (
              <div key={g.id || idx} className="medicion-card">
                <h3>{g.title}</h3>
                <div className="medicion-img-container" style={g.id === 'watches' || g.title.toLowerCase().includes('reloj') ? {maxWidth: '600px'} : {}}>
                  <img src={g.image} alt={g.title} />
                  {(g.labels || []).map((label, lIdx) => {
                    const style = {};
                    if (label.top !== undefined && label.left !== undefined) {
                      style.top = `${label.top}%`;
                      style.left = `${label.left}%`;
                      style.transform = 'translate(-50%, -50%)';
                    }
                    return (
                      <span 
                        key={lIdx} 
                        className={`medida-label ${label.className || ''}`} 
                        style={style}
                        dangerouslySetInnerHTML={{ __html: label.text.replace(/\n/g, '<br/>') }}
                      />
                    );
                  })}
                </div>
                <p className="medicion-desc">{g.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
