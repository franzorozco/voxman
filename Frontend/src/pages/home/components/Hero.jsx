import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Hero.css";

import modelo1 from "../../../assets/global/modelo_1.png";
import modelo2 from "../../../assets/global/modelo_2.png";
import modelo3 from "../../../assets/global/modelo_3.png";
import modelo4 from "../../../assets/global/modelo_4.png";

export default function Hero({ title, subtitle }) {
  const images = [modelo1, modelo2, modelo3, modelo4];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

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
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
      </div>

      <div className="hero-content">
        <h1>{title}</h1>
        <p>{subtitle}</p>

        <div className="hero-buttons">
          <Link to="/shop" className="btn primary">
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