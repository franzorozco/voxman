import React, { useEffect } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import logo from "../../assets/global/logo_black.png";
import dueno1 from "../../assets/global/modelo_1.png";
import dueno2 from "../../assets/global/modelo_2.png";

import "./Nosotros.css";

export default function Nosotros() {

  useEffect(() => {
    const elementos = document.querySelectorAll(".vox-fade");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("vox-visible");
        }
      });
    }, { threshold: 0.2 });

    elementos.forEach((el) => observer.observe(el));
  }, []);

useEffect(() => {
  let userInteracted = false;
  let autoScrollTimeout;

  const cancelAutoScroll = () => {
    userInteracted = true;
    clearTimeout(autoScrollTimeout);
  };

  window.addEventListener("scroll", cancelAutoScroll);
  window.addEventListener("wheel", cancelAutoScroll);
  window.addEventListener("touchstart", cancelAutoScroll);

  autoScrollTimeout = setTimeout(() => {
    if (!userInteracted) {
      const nextSection = document.querySelector(".vox-historia");

      if (nextSection) {
        nextSection.scrollIntoView({
          behavior: "smooth"
        });
      }
    }
  }, 5000);

  return () => {
    window.removeEventListener("scroll", cancelAutoScroll);
    window.removeEventListener("wheel", cancelAutoScroll);
    window.removeEventListener("touchstart", cancelAutoScroll);
    clearTimeout(autoScrollTimeout);
  };
}, []);

 return (
  <div className="vox-nosotros">

    <Navbar logo={logo} />

    {/* HERO */}
    <section className="vox-hero vox-fade">
      <div className="vox-hero-overlay">
        <h1>VOXman</h1>
        <p>Estilo masculino que habla por ti</p>
      </div>
    </section>

    {/* HISTORIA */}
    <section className="vox-historia vox-fade">
      <div className="vox-historia-container">
        <div className="vox-historia-texto">
          <h2>Nuestra Historia</h2>
          <p>
            VOXman nace de una idea simple pero poderosa: redefinir el estilo del hombre moderno.
            Somos una marca creada por dos jóvenes emprendedores que decidieron convertir su visión
            en una realidad.
          </p>
          <p>
            Más que ropa, buscamos transmitir identidad, seguridad y presencia.
            VOXman no es solo moda, es una actitud.
          </p>
        </div>

        <div className="vox-historia-visual"></div>
      </div>
    </section>

    {/* FUNDADORES */}
    <section className="vox-fundadores">

      <div className="vox-fundador vox-fade">
        <img src={dueno1} alt="Fundador 1" />
        <div>
          <h3>Franz Orozco Salzar</h3>
          <p>Visión digital y estrategia moderna de VOXman.</p>
        </div>
      </div>

      <div className="vox-fundador reverse vox-fade">
        <img src={dueno2} alt="Fundadora" />
        <div>
          <h3>Rous Vidal Mallea</h3>
          <p>Diseño, estética y esencia visual de la marca.</p>
        </div>
      </div>

    </section>

    {/* MISION VISION */}
    <section className="vox-mv vox-fade">
      <div className="vox-card">
        <h2>Misión</h2>
        <p>Ofrecer prendas que reflejen personalidad, confianza y estilo.</p>
      </div>

      <div className="vox-card">
        <h2>Visión</h2>
        <p>Ser referente en moda masculina a nivel nacional.</p>
      </div>
    </section>

    {/* VALORES */}
    <section className="vox-valores vox-fade">
      <h2>Valores</h2>
      <div className="vox-valores-grid">
        <span>Autenticidad</span>
        <span>Calidad</span>
        <span>Innovación</span>
        <span>Compromiso</span>
        <span>Estilo</span>
      </div>
    </section>

    <Footer />

  </div>
);
}