import React, { useEffect } from "react";
import "./Footer.css";
import { useShopSettingsStore } from "../../store/shop/useShopSettingsStore";
import { Phone, Mail } from "lucide-react";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";

export default function Footer() {
  const { settings, fetchSettings } = useShopSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* BRAND */}
        <div className="footer-column">
          <h2 className="logo">{settings?.store_name || "VOXman"}</h2>
          <p>
            Moda masculina moderna, minimalista y con identidad.
            Diseñada para hombres que buscan estilo y presencia.
          </p>
        </div>

        {/* LINKS */}
        <div className="footer-column">
          <h3>Enlaces</h3>
          <a href="/">Inicio</a>
          <a href="/shop/catalog">Tienda</a>
          <a href="/nosotros">Nosotros</a>
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
          <p className="contact-item">
            <Mail size={16} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />
            {settings?.contact_email || "soporte@voxman.com"}
          </p>
          <p className="contact-item">
            <Phone size={16} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />
            {settings?.store_phone || "+591 70000000"}
          </p>

          <div className="socials">
            {settings?.instagram_url && (
              <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaInstagram size={18} /> Instagram
              </a>
            )}
            {settings?.tiktok_url && (
              <a href={settings.tiktok_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaTiktok size={18} /> TikTok
              </a>
            )}
            {settings?.facebook_url && (
              <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaFacebook size={18} /> Facebook
              </a>
            )}
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
        <p>© {new Date().getFullYear()} {settings?.store_name || "VOXman"}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}