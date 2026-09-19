import React from "react";
import * as Icons from "lucide-react";
import { useShopSettingsStore } from "../../../../store/shop/useShopSettingsStore";

export default function EntregasHero() {
  const { settings } = useShopSettingsStore();

  const iconName = settings.shipping_hero_icon || "Package";
  const IconCmp = Icons[iconName] || Icons.Package;

  return (
    <section className="vox-entregas-hero">
      <div className="vox-hero-overlay"></div>
      <div className="vox-hero-content vox-reveal">
        <div className="vox-icon-container">
          <IconCmp strokeWidth={1} size={80} className="vox-hero-icon" />
        </div>
        <h1 className="vox-hero-title">
          {settings.shipping_hero_title || "LLEGAMOS DONDE TÚ ESTÉS."}
        </h1>
        <p className="vox-hero-subtitle">
          {settings.shipping_hero_subtitle || "Envíos rápidos, seguros y sin complicaciones a nivel nacional."}
        </p>
      </div>
      <div className="vox-scroll-indicator">
        <div className="mouse"></div>
      </div>
    </section>
  );
}
