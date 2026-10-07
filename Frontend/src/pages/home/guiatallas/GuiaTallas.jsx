import React, { useEffect } from "react";
import "./GuiaTallas.css";

export default function GuiaTallas() {
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
  }, []);

  return (
    <main className="guia-tallas-page">
      <section className="guia-content-section">
        {/* HEADER */}
        <div className="guia-header vox-reveal">
          <h1 className="main-title">GUÍA DE TALLAS</h1>
          <p className="main-subtitle">
            Cada una de nuestras prendas tiene un corte y caída únicos según su diseño. 
            A continuación, te mostramos cómo medimos nuestras prendas para que puedas 
            compararlas con tu ropa favorita y encontrar tu fit ideal.
          </p>
        </div>

        {/* CÓMO MEDIR */}
        <div className="como-medir-section vox-reveal">
          <div className="medicion-grid">
            {/* TOPS MANGA LARGA */}
            <div className="medicion-card">
              <h3>TOPS MANGA LARGA (Polerones, Hoodies, Chaquetas)</h3>
              <div className="medicion-img-container">
                <img src="/assets/img/guia-tallas/top.jpg" alt="Medición de Tops Manga Larga" />
                <span className="medida-label label-largo-top">Largo</span>
                <span className="medida-label label-ancho-top">Ancho<br/>(Pecho)</span>
                <span className="medida-label label-manga-top">Largo de<br/>Manga</span>
              </div>
              <p className="medicion-desc">Coloca tu prenda favorita en una superficie plana y mide de extremo a extremo.</p>
            </div>

            {/* TOPS MANGA CORTA */}
            <div className="medicion-card">
              <h3>TOPS MANGA CORTA (Camisas, Polos, Poleras)</h3>
              <div className="medicion-img-container">
                <img src="/assets/img/guia-tallas/short_sleeve.jpg" alt="Medición de Tops Manga Corta" />
                <span className="medida-label label-hombro-short">Hombro</span>
                <span className="medida-label label-ancho-short">Ancho<br/>(Pecho)</span>
                <span className="medida-label label-largo-short">Largo</span>
                <span className="medida-label label-manga-short">Manga</span>
              </div>
              <p className="medicion-desc">Mide el ancho de hombro a hombro, el pecho de axila a axila y el largo total.</p>
            </div>

            {/* BOTTOMS */}
            <div className="medicion-card">
              <h3>BOTTOMS (Pantalones, Jeans, Shorts)</h3>
              <div className="medicion-img-container">
                <img src="/assets/img/guia-tallas/bottom.jpg" alt="Medición de Pantalones" />
                <span className="medida-label label-cintura-bot">Cintura</span>
                <span className="medida-label label-tiro-bot">Tiro</span>
                <span className="medida-label label-largo-bot">Largo<br/>Total</span>
              </div>
              <p className="medicion-desc">Mide la cintura de lado a lado y el largo exterior desde la cintura al tobillo.</p>
            </div>

            {/* ACCESORIOS */}
            <div className="medicion-card">
              <h3>ACCESORIOS (Gorros, Sombreros)</h3>
              <div className="medicion-img-container">
                <img src="/assets/img/guia-tallas/hat.jpg" alt="Medición de Sombreros" />
                <span className="medida-label label-circ-hat">Circunferencia</span>
                <span className="medida-label label-alto-hat">Alto</span>
              </div>
              <p className="medicion-desc">Mide el contorno de tu cabeza a la altura de la frente.</p>
            </div>

            {/* RELOJES */}
            <div className="medicion-card">
              <h3>RELOJES</h3>
              <div className="medicion-img-container" style={{maxWidth: '600px'}}>
                <img src="/assets/img/guia-tallas/watch.jpg" alt="Medición de Relojes" />
                <span className="medida-label label-diametro-watch">Diámetro<br/>Caja</span>
                <span className="medida-label label-largo-watch">Largo Total<br/>(Correa)</span>
              </div>
              <p className="medicion-desc">El diámetro de la caja te dará una idea de qué tan grande se verá en tu muñeca.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
