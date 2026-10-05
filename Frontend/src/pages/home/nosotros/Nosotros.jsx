import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../../../components/layout/Footer";
import * as Icons from "lucide-react";
import { Heart, Target, Compass, Star, Award, Shield } from "lucide-react";

import { useShopSettingsStore } from "../../../store/shop/useShopSettingsStore";
import { getImageUrl } from '../../../utils/imageUtils';
import { URL_BASE_VIDEOS } from "../../../config/api";

import dueno1 from "../../../assets/global/Franz.jpg";
import dueno2 from "../../../assets/global/Rous.jpg";

import "./Nosotros.css";
 
export default function Nosotros() {
  const { settings } = useShopSettingsStore();
  
  // En la pagina de Nosotros usamos fondo oscuro (Navbar oscuro), 
  // por lo que necesitamos el logo claro/blanco.
  const heroLogo = settings.store_logo_dark 
    ? getImageUrl(settings.store_logo_dark) 
    : getImageUrl('/system/logos/logo_white_sinfondo.png');
  
  // Intersection Observer para las animaciones al hacer scroll
  useEffect(() => {
    const elementos = document.querySelectorAll(".vox-reveal, .vox-reveal-left, .vox-reveal-right");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            // Unobserve to run only once
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -50px 0px" }
    );

    elementos.forEach((el) => observer.observe(el));

    return () => {
      elementos.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const getArraySetting = (key, defaultArr = []) => {
    try {
      return settings[key] ? JSON.parse(settings[key]) : defaultArr;
    } catch {
      return defaultArr;
    }
  };

  const storyParagraphs = getArraySetting("about_story_paragraphs", [
    "VOXman no naciÃ³ en una sala de juntas. NaciÃ³ de conversaciones a altas horas de la noche, de caminatas despuÃ©s de entrenar y del profundo deseo de dos mentes apasionadas por construir algo propio.",
    "Esta marca es el reflejo vivo de nuestra historia. Hemos atravesado tormentas y dÃ­as soleados, tiempos donde todo parecÃ­a ir en contra y momentos donde el esfuerzo daba sus primeros frutos. Cada hilo, cada diseÃ±o y cada lÃ­nea de cÃ³digo en este proyecto lleva impregnada nuestra resiliencia.",
    "No importa cuÃ¡ntas veces la vida se ponga difÃ­cil, aprendimos que luchando juntos no hay barrera insuperable. Creamos VOXman para transmitir esa energÃ­a: la confianza de que puedes enfrentar al mundo y ganar."
  ]);

  const StoryIconCmp = settings.about_story_card_icon && Icons[settings.about_story_card_icon] 
    ? Icons[settings.about_story_card_icon] 
    : Heart;

  return (
    <div className="vox-nosotros-page">
      <Navbar isDarkThemeOverride={true} />

      {/* HERO SECTION */}
      {String(settings.about_section_hero_show) !== "0" && (
        <section className="vox-nosotros-hero">
          {settings.about_hero_video && (
            <video 
              src={`${URL_BASE_VIDEOS}${settings.about_hero_video}`} 
              autoPlay muted loop playsInline
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
            />
          )}
          <div className="vox-hero-overlay" style={{ 
            background: settings.about_hero_overlay_color 
              ? `rgba(${parseInt(settings.about_hero_overlay_color.slice(1,3), 16)}, ${parseInt(settings.about_hero_overlay_color.slice(3,5), 16)}, ${parseInt(settings.about_hero_overlay_color.slice(5,7), 16)}, ${settings.about_hero_overlay_opacity !== undefined ? settings.about_hero_overlay_opacity / 100 : 0.5})` 
              : undefined 
          }}></div>
          <div className="vox-hero-content vox-reveal" style={{ zIndex: 2 }}>
            <div className="vox-hero-logo-container">
              <img src={heroLogo} alt="VOXman Logo" className="vox-hero-logo" />
            </div>
            <h1 className="vox-hero-title">{settings.about_hero_title || "MÃS QUE ROPA, UNA IDENTIDAD."}</h1>
            <p className="vox-hero-subtitle">
              {settings.about_hero_subtitle || "Forjados en la perseverancia. Construidos con pasiÃ³n."}
            </p>
          </div>
          <div className="vox-scroll-indicator" style={{ zIndex: 2 }}>
            <div className="mouse"></div>
          </div>
        </section>
      )}

      {/* NUESTRA HISTORIA (EL VIAJE) */}
      {String(settings.about_section_history_show) !== "0" && (
        <section className="vox-story-section">
          <div className="vox-container">
            <div className="vox-story-grid">
              <div className="vox-story-text vox-reveal-left">
                <span className="vox-overline">{settings.about_story_overline || "El Origen"}</span>
                <h2 className="vox-section-title">{settings.about_story_title || "El Inicio de un SueÃ±o"}</h2>
                <div className="vox-story-paragraphs">
                  {storyParagraphs.map((p, i) => (
                    <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
                  ))}
                </div>
              </div>
              
              <div className="vox-story-image-wrapper vox-reveal-right">
                <div className="vox-story-image-glass">
                  <StoryIconCmp strokeWidth={1} size={56} className="vox-heart-icon" />
                  <h3>{settings.about_story_card_title || "Nuestra Promesa"}</h3>
                  <p>{settings.about_story_card_text || "\"Construir algo verdadero, algo que dure y que trascienda. Todo lo que hacemos, lo hacemos con el corazÃ³n y una obsesiÃ³n por la excelencia.\""}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* LOS FUNDADORES */}
      {String(settings.about_section_founders_show) !== "0" && (
        <section className="vox-founders-section">
          <div className="vox-container">
            <div className="vox-section-header vox-reveal">
              <span className="vox-overline">{settings.about_founders_overline || "Los Creadores"}</span>
              <h2 className="vox-section-title">{settings.about_founders_title || "Quienes Somos"}</h2>
              <p className="vox-section-subtitle">{settings.about_founders_subtitle || "Dos mentes, un solo corazÃ³n detrÃ¡s de la marca."}</p>
            </div>

            <div className="vox-founders-grid">
              {(getArraySetting("about_founders_list", [
                { name: "Franz Orozco", role: "Desarrollo y VisiÃ³n EstratÃ©gica", text: "La lÃ³gica, el cÃ³digo...", image: "/system/global/Franz.jpg" },
                { name: "Rous Vidal", role: "EstÃ©tica, Arte y DirecciÃ³n Visual", text: "El alma creativa...", image: "/system/global/Rous.jpg" }
              ])).map((f, i) => (
                <div key={i} className={`vox-founder-card vox-reveal ${i % 2 !== 0 ? 'delay-1' : ''}`}>
                  <div className="vox-founder-image-box">
                    <img 
                      src={f.image ? getImageUrl(f.image) : (i === 0 ? dueno1 : dueno2)} 
                      alt={f.name} 
                      className="vox-founder-img" 
                      loading="lazy" 
                      onError={(e) => { e.target.src = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/Imagen_usuario_no_encontrado_black.jfif"; }}
                    />
                  </div>
                  <div className="vox-founder-info">
                    <h3>{f.name}</h3>
                    <span className="vox-founder-role">{f.role}</span>
                    <p>{f.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MISIÃ“N, VISIÃ“N Y VALORES */}
      {String(settings.about_section_mvp_show) !== "0" && (
        <>
          <section className="vox-mv-section">
            <div className="vox-container">
              <div className="vox-mv-grid">
                <div className="vox-mv-card vox-reveal-left">
                  <div className="vox-mv-icon-circle">
                    {(() => {
                      const MIcon = settings.about_mvp_mission_icon && Icons[settings.about_mvp_mission_icon] ? Icons[settings.about_mvp_mission_icon] : Target;
                      return <MIcon strokeWidth={1.5} size={36} />;
                    })()}
                  </div>
                  <h3>{settings.about_mvp_mission_title || "Nuestra MisiÃ³n"}</h3>
                  <p>{settings.about_mvp_mission_text || "Ofrecer mÃ¡s que prendas de vestir. Entregamos herramientas de confianza. Nuestra misiÃ³n es confeccionar moda que haga sentir a cada persona segura de sÃ­ misma, respaldada por una calidad inquebrantable y un diseÃ±o que hable por su carÃ¡cter."}</p>
                </div>

                <div className="vox-mv-card vox-reveal-right delay-1">
                  <div className="vox-mv-icon-circle">
                    {(() => {
                      const VIcon = settings.about_mvp_vision_icon && Icons[settings.about_mvp_vision_icon] ? Icons[settings.about_mvp_vision_icon] : Compass;
                      return <VIcon strokeWidth={1.5} size={36} />;
                    })()}
                  </div>
                  <h3>{settings.about_mvp_vision_title || "Nuestra VisiÃ³n"}</h3>
                  <p>{settings.about_mvp_vision_text || "Posicionarnos como el referente definitivo de la moda y la superaciÃ³n a nivel nacional. Aspiramos a ser una marca que no solo vista cuerpos, sino que inspire historias de Ã©xito, demostrando que desde cero se puede llegar a lo mÃ¡s alto."}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="vox-values-section">
            <div className="vox-container">
              <div className="vox-section-header vox-reveal">
                <span className="vox-overline">{settings.about_values_overline || "La Esencia"}</span>
                <h2 className="vox-section-title">{settings.about_values_title || "Nuestros Pilares"}</h2>
              </div>

              <div className="vox-values-grid">
                {(getArraySetting("about_values_list", [
                  { title: "Autenticidad", text: "No seguimos moldes, creamos nuestra propia identidad con originalidad pura.", icon: "Award" },
                  { title: "Calidad", text: "AtenciÃ³n obsesiva a los detalles para entregar un producto que perdure en el tiempo.", icon: "Star" },
                  { title: "Resiliencia", text: "Crecemos ante la adversidad. Nunca nos rendimos, siempre encontramos un camino.", icon: "Shield" }
                ])).map((val, idx) => {
                  const ValIcon = val.icon && Icons[val.icon] ? Icons[val.icon] : Star;
                  return (
                    <div key={idx} className={`vox-value-item vox-reveal ${idx === 1 ? 'delay-1' : idx === 2 ? 'delay-2' : ''}`}>
                      <div className="vox-val-icon-wrapper">
                        <ValIcon strokeWidth={1.5} className="vox-val-icon" />
                      </div>
                      <h4>{val.title}</h4>
                      <p>{val.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
}
