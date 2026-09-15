import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../../../components/layout/Footer";
import Hero from "../components/Hero";
import FeaturedCategories from "../components/FeaturedCategories";
import DynamicProductCarousel from "../components/DynamicProductCarousel";
import ValueProps from "../components/ValueProps";
import { useShopSettingsStore } from "../../../store/shop/useShopSettingsStore";

import "./Home.css";

export default function Home() {
  const { settings, fetchSettings } = useShopSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const isEnabled = (val) => val !== "false" && val !== false && val !== "0" && val !== 0;

  const showHero       = isEnabled(settings.home_show_hero);
  const showCarousel   = isEnabled(settings.home_show_carousel);
  const showValueProps = isEnabled(settings.home_show_value_props);
  const showCategories = isEnabled(settings.home_show_categories);
  const showNewsletter = isEnabled(settings.home_show_newsletter);

  return (
    <div className="home">

      <Navbar isDarkThemeOverride={true} />

      {showHero && (
        <Hero
          title={settings.home_hero_title || "VØXman"}
          subtitle={settings.home_hero_subtitle || "Estilo masculino moderno, minimalista y potente."}
        />
      )}

      {showValueProps && <ValueProps />}

      {showCarousel && <DynamicProductCarousel />}

      {showCategories && <FeaturedCategories />}



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
