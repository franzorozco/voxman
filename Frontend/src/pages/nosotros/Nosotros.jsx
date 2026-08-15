import React, { useEffect, useRef } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { Heart, Target, Award, Shield, Compass, Star } from "lucide-react";

import { API_BASE_URL } from "../../config/api";
const navLogo = `${API_BASE_URL}/storage/system/logos/logo_black_sinfondo.png`;
const heroLogo = `${API_BASE_URL}/storage/system/logos/logo_black_sinfondo.png`;
import dueno1 from "../../assets/global/Franz.jpg";
import dueno2 from "../../assets/global/Rous.jpg";

import "./Nosotros.css";
 
export default function Nosotros() {
  
  // Intersection Observer para las animaciones al hacer scroll
  useEffect(() => {
    const elementos = document.querySelectorAll(".vox-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.15 }
    );

    elementos.forEach((el) => observer.observe(el));

    return () => {
      elementos.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="vox-nosotros-page">
      <Navbar logo={navLogo} />

      {/* HERO SECTION */}
      <section className="vox-nosotros-hero">
        <div className="vox-hero-overlay"></div>
        <div className="vox-hero-content vox-reveal">
          <div className="vox-hero-logo-container">
            <img src={heroLogo} alt="VOXman Logo" className="vox-hero-logo" />
          </div>
          <h1 className="vox-hero-title">Más que ropa, una identidad.</h1>
          <p className="vox-hero-subtitle">
            Forjados en la perseverancia. Construidos con pasión.
          </p>
          <div className="vox-scroll-indicator">
            <div className="mouse"></div>
          </div>
        </div>
      </section>

      {/* NUESTRA HISTORIA (EL VIAJE) */}
      <section className="vox-story-section">
        <div className="vox-container">
          <div className="vox-story-grid">
            <div className="vox-story-text vox-reveal">
              <h2 className="vox-section-title">El Inicio de un Sueño</h2>
              <div className="vox-story-paragraphs">
                <p>
                  <strong>VOXman</strong> no nació en una sala de juntas, nació de conversaciones a altas horas de la noche, de caminatas después de entrenar, y del profundo deseo de dos jóvenes enamorados por construir algo propio.
                </p>
                <p>
                  Esta marca es el reflejo vivo de nuestra relación. Hemos atravesado tormentas y días soleados, tiempos donde todo parecía ir en contra y momentos donde el esfuerzo daba sus primeros frutos. Cada hilo, cada diseño y cada línea de código en este proyecto lleva impregnada nuestra historia de resiliencia.
                </p>
                <p>
                  No importa cuántas veces la vida se ponga difícil, aprendimos que si luchamos juntos, no hay barrera que no podamos superar. Creamos VOXman para transmitir esa misma energía a quienes visten nuestras prendas: la confianza de que puedes enfrentar al mundo y ganar.
                </p>
              </div>
            </div>
            
            <div className="vox-story-image-wrapper vox-reveal">
              <div className="vox-story-image-glass">
                <Heart size={48} className="vox-heart-icon" />
                <h3>Nuestra Promesa</h3>
                <p>"Construir algo verdadero, algo que dure y que trascienda. Todo lo que hacemos, lo hacemos con el corazón."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOS FUNDADORES */}
      <section className="vox-founders-section">
        <div className="vox-container">
          <div className="vox-section-header vox-reveal">
            <h2 className="vox-section-title">Quienes Somos</h2>
            <p className="vox-section-subtitle">Dos mentes, un solo corazón detrás de la marca.</p>
          </div>

          <div className="vox-founders-grid">
            {/* FUNDADOR 1 */}
            <div className="vox-founder-card vox-reveal">
              <div className="vox-founder-image-box">
                <img src={dueno1} alt="Franz Orozco" className="vox-founder-img" />
                <div className="vox-founder-overlay"></div>
              </div>
              <div className="vox-founder-info">
                <h3>Franz Orozco</h3>
                <span className="vox-founder-role">Desarrollo y Visión Estratégica</span>
                <p>
                  La lógica, el código y la perseverancia. Franz es la mente detrás de la estructura tecnológica y comercial de VOXman. Su enfoque incansable asegura que la marca no solo luzca bien, sino que funcione de manera impecable y escale hacia el futuro.
                </p>
              </div>
            </div>

            {/* FUNDADORA 2 */}
            <div className="vox-founder-card vox-reveal delay-1">
              <div className="vox-founder-image-box">
                <img src={dueno2} alt="Rous Vidal" className="vox-founder-img" />
                <div className="vox-founder-overlay"></div>
              </div>
              <div className="vox-founder-info">
                <h3>Rous Vidal</h3>
                <span className="vox-founder-role">Estética, Arte y Dirección Visual</span>
                <p>
                  El alma creativa, el buen gusto y la pasión visual. Rous aporta la sensibilidad artística que hace que cada detalle de VOXman respire autenticidad y elegancia. Es el corazón estético que conecta nuestra ropa con las emociones de las personas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISIÓN Y VISIÓN */}
      <section className="vox-mv-section">
        <div className="vox-container">
          <div className="vox-mv-grid">
            <div className="vox-mv-card vox-reveal">
              <div className="vox-mv-icon-circle">
                <Target size={32} />
              </div>
              <h3>Nuestra Misión</h3>
              <p>
                Ofrecer más que prendas de vestir. Queremos entregar herramientas de confianza. Nuestra misión es confeccionar moda que haga sentir a cada persona segura de sí misma, respaldada por calidad inquebrantable y un diseño que hable por su carácter.
              </p>
            </div>

            <div className="vox-mv-card vox-reveal delay-1">
              <div className="vox-mv-icon-circle">
                <Compass size={32} />
              </div>
              <h3>Nuestra Visión</h3>
              <p>
                Posicionarnos como el referente definitivo de la moda y la superación a nivel nacional. Aspiramos a ser una marca que no solo vista cuerpos, sino que inspire historias de éxito, demostrando que desde cero se puede llegar a lo más alto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VALORES (LA ESENCIA) */}
      <section className="vox-values-section">
        <div className="vox-container">
          <div className="vox-section-header vox-reveal">
            <h2 className="vox-section-title">Nuestra Esencia</h2>
            <p className="vox-section-subtitle">Los pilares sobre los que construimos nuestro día a día.</p>
          </div>

          <div className="vox-values-grid">
            <div className="vox-value-item vox-reveal">
              <Award className="vox-val-icon" />
              <h4>Autenticidad</h4>
              <p>No seguimos moldes, creamos nuestra propia identidad con originalidad pura.</p>
            </div>
            
            <div className="vox-value-item vox-reveal delay-1">
              <Star className="vox-val-icon" />
              <h4>Calidad</h4>
              <p>Atención obsesiva a los detalles para entregar un producto que perdure en el tiempo.</p>
            </div>
            
            <div className="vox-value-item vox-reveal delay-2">
              <Shield className="vox-val-icon" />
              <h4>Resiliencia</h4>
              <p>Crecemos ante la adversidad. Nunca nos rendimos, siempre encontramos un camino.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}