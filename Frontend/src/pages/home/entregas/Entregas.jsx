import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../../../components/layout/Footer";
import EntregasHero from "./components/EntregasHero";
import DeliveryMethods from "./components/DeliveryMethods";
import HowItWorks from "./components/HowItWorks";
import { useShopSettingsStore } from "../../../store/shop/useShopSettingsStore";
import "./Entregas.css";

export default function Entregas() {
  const { settings } = useShopSettingsStore();

  // Intersection Observer para las animaciones al hacer scroll
  useEffect(() => {
    // Usamos setTimeout para asegurar que React haya pintado el DOM después de cambiar settings
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
      // No cleanup since elements might change and we observe broadly
    }, 100);

    return () => clearTimeout(timer);
  }, [settings]); // <--- Re-ejecutar cuando carguen los settings nuevos

  return (
    <div className="vox-entregas-page">
      <Navbar isDarkThemeOverride={true} />
      
      <EntregasHero />
      <DeliveryMethods />
      <HowItWorks />

      <Footer />
    </div>
  );
}
