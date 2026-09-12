import { getImageUrl } from '../../../utils/imageUtils';
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../../../components/layout/Footer";
import Hero from "../components/Hero";

import { API_BASE_URL } from "../../../config/api";
const logo = getImageUrl('/system/logos/logo_black_sinfondo.png');
import modelo1 from "../../../assets/global/modelo_1.png";
import modelo2 from "../../../assets/global/modelo_2.png";
import modelo3 from "../../../assets/global/modelo_3.png";
import modelo4 from "../../../assets/global/modelo_4.png";

import fondoDestacados from "../../../assets/global/fondos/fondo_grafito.png";

import "./Home.css";

export default function Home() {
  return (
    <div className="home">

      <Navbar isDarkThemeOverride={true} />

      <Hero
        title="VØXman"
        subtitle="Estilo masculino moderno, minimalista y potente."
      />

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

      <Footer />

    </div>
  );
}
