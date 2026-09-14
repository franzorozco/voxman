import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../../../components/layout/Footer";
import Hero from "../components/Hero";
import { useShopSettingsStore } from "../../../store/shop/useShopSettingsStore";

import fondoDestacados from "../../../assets/global/fondos/fondo_grafito.png";
import "./Home.css";

export default function Home() {
  const { settings, fetchSettings } = useShopSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const showHero       = settings.home_show_hero       !== "false";
  const showFeatured   = settings.home_show_featured   !== "false";
  const showCategories = settings.home_show_categories !== "false";
  const showNewsletter = settings.home_show_newsletter !== "false";

  return (
    <div className="home">

      <Navbar isDarkThemeOverride={true} />

      {showHero && (
        <Hero
          title={settings.home_hero_title || "VØXman"}
          subtitle={settings.home_hero_subtitle || "Estilo masculino moderno, minimalista y potente."}
        />
      )}

      {showCategories && (
        <section className="section">
          <div className="container">
            <h2>Categorías</h2>
            <div className="grid">
              <div className="card">Camisetas</div>
              <div className="card">Pantalones</div>
              <div className="card">Chaquetas</div>
              <div className="card">Accesorios</div>
            </div>
          </div>
        </section>
      )}

      {showFeatured && (
        <section
          className="section destacados"
          style={{ backgroundImage: `url(${fondoDestacados})` }}
        >
          <div className="container">
            <h2>Destacados</h2>
            <div className="grid">
              <div className="product">
                <div className="img"></div>
                <p>Oversize Black Tee</p>
                <span>$29.99</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {showNewsletter && (
        <section className="section">
          <div className="container" style={{ textAlign: "center" }}>
            <h2>Suscríbete</h2>
            <p>Recibe ofertas y novedades directo en tu correo.</p>
          </div>
        </section>
      )}

      <Footer />

    </div>
  );
}
