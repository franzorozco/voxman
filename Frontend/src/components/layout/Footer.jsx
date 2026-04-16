import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* BRAND */}
        <div className="footer-column">
          <h2 className="logo">VOXman</h2>
          <p>
            Moda masculina moderna, minimalista y con identidad.
            Diseñada para hombres que buscan estilo y presencia.
          </p>
        </div>

        {/* LINKS */}
        <div className="footer-column">
          <h3>Enlaces</h3>
          <a href="#">Inicio</a>
          <a href="#">Tienda</a>
          <a href="#">Colecciones</a>
          <a href="#">Ofertas</a>
        </div>

        {/* HELP */}
        <div className="footer-column">
          <h3>Ayuda</h3>
          <a href="#">Contacto</a>
          <a href="#">Envíos</a>
          <a href="#">Devoluciones</a>
          <a href="#">Guía de tallas</a>
        </div>

        {/* CONTACT */}
        <div className="footer-column">
          <h3>Contacto</h3>
          <p>Email: soporte@voxman.com</p>
          <p>Tel: +591 70000000</p>

          <div className="socials">
            <a href="#">Instagram</a>
            <a href="#">TikTok</a>
            <a href="#">Facebook</a>
          </div>
        </div>

        {/* NEWSLETTER */}
        <div className="footer-column">
          <h3>Newsletter</h3>
          <p>Recibe ofertas y nuevos lanzamientos</p>
          <form className="newsletter">
            <input type="email" placeholder="Tu email" />
            <button type="submit">Unirme</button>
          </form>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} VOXman. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}