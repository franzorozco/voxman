import React, { useEffect, useState } from "react";
import "./Footer.css";
import { useShopSettingsStore } from "../../store/shop/useShopSettingsStore";
import { Phone, Mail } from "lucide-react";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";
import { toast } from "react-hot-toast";

export default function Footer() {
  const { settings, fetchSettings } = useShopSettingsStore();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const facebookUrl = settings?.facebook_url || "https://www.facebook.com/share/1P3bhWMDvk/";
  const instagramUrl = settings?.instagram_url || "https://www.instagram.com/voxmanlapaz?stkn=MXdldjE3ZjdhcjJxMg==";
  const tiktokUrl = settings?.tiktok_url || "https://www.tiktok.com/@voxmanlapaz?_r=1&_t=ZS-9AKdTjFMY4q";
  const phoneStr = settings?.store_phone || "+591 57003312";

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/newsletter/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw { response: { status: res.status, data } };
      }
      
      toast.success(data.message || "¡Suscrito correctamente!");
      setEmail("");
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error("Demasiados intentos. Intenta más tarde.");
      } else {
        toast.error(error.response?.data?.message || "Error al suscribirse. Intenta de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

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
          <Link to="/">Inicio</Link>
          <Link to="/shop/catalog">Tienda</Link>
          <Link to="/nosotros">Nosotros</Link>
        </div>

        {/* HELP */}
        <div className="footer-column">
          <h3>Ayuda</h3>
          <Link to="/contacto">Contacto</Link>
          <Link to="/entregas">Envíos</Link>
          <Link to="/devoluciones">Devoluciones</Link>
          <Link to="/guia-tallas">Guía de tallas</Link>
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
            {phoneStr}
          </p>

          <div className="socials">
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaInstagram size={18} /> Instagram
            </a>
            <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaTiktok size={18} /> TikTok
            </a>
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaFacebook size={18} /> Facebook
            </a>
          </div>
        </div>

        {/* NEWSLETTER */}
        <div className="footer-column" id="newsletter">
          <h3>Newsletter</h3>
          <p>Recibe ofertas y nuevos lanzamientos</p>
          <form className="newsletter" onSubmit={handleSubscribe}>
            <input 
              type="email" 
              placeholder="Tu email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Unirme'}
            </button>
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