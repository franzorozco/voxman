import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./Hero.css";
import { useShopSettingsStore } from "../../../store/shop/useShopSettingsStore";
import { getImageUrl } from "../../../utils/imageUtils";

const FALLBACK_IMAGE = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/image_not_found_black.jfif";

export default function Hero({ title, subtitle }) {
  const settings = useShopSettingsStore((s) => s.settings);

  // Parse dynamic images from settings; fall back to local assets
  const dynamicImages = (() => {
    try {
      const parsed = JSON.parse(settings.home_hero_images || "[]");
      return parsed.length > 0 ? parsed.map(getImageUrl) : null;
    } catch {
      return null;
    }
  })();

  const images = dynamicImages || [FALLBACK_IMAGE, FALLBACK_IMAGE, FALLBACK_IMAGE, FALLBACK_IMAGE];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setCurrent(0); // reset when images change
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);
  const hoverTimeoutRef = useRef(null);
  const enterTimeoutRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseEnter = (index) => {
    // Al entrar a una columna, cancelamos la desaparición del efecto
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (hoveredIdx === index) return;

    // Retardo pequeño para confirmar que el usuario quiere ver esta imagen
    // y no está simplemente cruzando el mouse para llegar a un botón.
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
    }
    enterTimeoutRef.current = setTimeout(() => {
      setHoveredIdx(index);
    }, 250); // 250ms de retardo antes de cambiar
  };

  const handleMouseLeave = () => {
    // Si el usuario sale antes de los 250ms, cancelamos el cambio
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
      enterTimeoutRef.current = null;
    }

    // Iniciamos la cuenta regresiva para quitar el efecto
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredIdx(null);
    }, 2000); // 2 segundos
  };

  // Determinar si desplazar a izquierda o derecha
  let contentShift = "0";
  if (hoveredIdx !== null && isDesktop) {
    if (hoveredIdx < images.length / 2) {
      // Hover en la mitad izquierda -> texto a la derecha
      contentShift = "18vw";
    } else {
      // Hover en la mitad derecha -> texto a la izquierda
      contentShift = "-18vw";
    }
  }

  return (
    <section className={`hero ${hoveredIdx !== null ? 'has-hover' : ''}`}>

      <div className="hero-split">

        <div className="hero-tag">
          <span>COMPRA</span>
          <span>ONLINE</span>
        </div>

        {images.map((img, i) => (
          <div
            key={i}
            className={`hero-col ${i === current ? "active" : ""} ${hoveredIdx === i ? "is-hovered" : ""}`}
            onMouseEnter={() => handleMouseEnter(i)}
            onMouseLeave={handleMouseLeave}
          >
            <img 
              src={img} 
              alt="Hero" 
              fetchpriority={i === 0 ? "high" : "auto"}
              loading={i === 0 ? "eager" : "lazy"}
              onError={(e) => { e.target.src = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/image_not_found_black.jfif"; }}
            />
          </div>
        ))}
      </div>

      <div 
        className="hero-content"
        style={{ 
          transform: hoveredIdx !== null ? `translateX(${contentShift}) scale(0.9)` : 'translateX(0) scale(1)' 
        }}
        onMouseEnter={() => {
          if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        }}
        onMouseLeave={handleMouseLeave}
      >
        <h1>{title}</h1>
        <p>{subtitle}</p>

        <div className="hero-buttons">
          <Link to="/catalog" className="btn primary">
            Explorar tienda
          </Link>
          <Link to="/register" className="btn secondary">
            Crear cuenta
          </Link>
        </div>
      </div>

    </section>
  );
}