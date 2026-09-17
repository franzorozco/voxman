import React, { useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../../../components/layout/Footer";
import Hero from "../components/Hero";
import FeaturedCategories from "../components/FeaturedCategories";
import DynamicProductCarousel from "../components/DynamicProductCarousel";
import ValueProps from "../components/ValueProps";
import TopBar from "../components/TopBar";
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

  const showTopBars    = isEnabled(settings.home_show_top_bars);

  /* ── Parse top bars ── */
  const topBars = useMemo(() => {
    if (!showTopBars) return [];
    try {
      const parsed = JSON.parse(settings.home_top_bars || "[]");
      return Array.isArray(parsed) ? parsed.filter((b) => b.isVisible) : [];
    } catch {
      return [];
    }
  }, [settings.home_top_bars, showTopBars]);

  /** Returns TopBar components for a given position slot */
  const renderTopBars = (position) =>
    topBars
      .filter((b) => b.position === position)
      .map((b) => <TopBar key={b.id} {...b} />);

  return (
    <div className="home" style={{ paddingTop: '70px', backgroundColor: '#000' }}>
      <Navbar isDarkThemeOverride={true} />

      {/* above_hero — encima del hero (pegado debajo de la navbar) */}
      {renderTopBars("above_hero")}

      {showHero && (
        <Hero
          title={settings.home_hero_title || "VØXman"}
          subtitle={settings.home_hero_subtitle || "Estilo masculino moderno, minimalista y potente."}
        />
      )}

      {/* below_hero — justo debajo del hero */}
      {renderTopBars("below_hero")}

      {showValueProps && <ValueProps />}

      {/* below_value_props — debajo de beneficios */}
      {renderTopBars("below_value_props")}

      {showCarousel && <DynamicProductCarousel />}

      {/* below_carousel — debajo del carrusel */}
      {renderTopBars("below_carousel")}

      {showCategories && <FeaturedCategories />}

      {/* below_categories — debajo de categorías */}
      {renderTopBars("below_categories")}



      {/* above_footer — justo antes del footer */}
      {renderTopBars("above_footer")}

      <Footer />

    </div>
  );
}
