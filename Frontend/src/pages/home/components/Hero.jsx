import React, { useState, useEffect } from "react";
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

  return (
    <section className="hero">

      <div className="hero-split">

        <div className="hero-tag">
          <span>COMPRA</span>
          <span>ONLINE</span>
        </div>

        {images.map((img, i) => (
          <div
            key={i}
            className={`hero-col ${i === current ? "active" : ""}`}
          >
            <img 
              src={img} 
              alt="Hero" 
              onError={(e) => { e.target.src = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/image_not_found_black.jfif"; }}
            />
          </div>
        ))}
      </div>

      <div className="hero-content">
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