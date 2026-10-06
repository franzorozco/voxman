import React, { useState } from 'react';
import { Mail, MessageCircle, Send, Loader2 } from 'lucide-react';
import { useShopSettingsStore } from "../../../store/shop/useShopSettingsStore";
import { useAuthStore } from "../../../store/authStore";
import Navbar from "../components/Navbar";
import Footer from "../../../components/layout/Footer";
import toast from 'react-hot-toast';
import './Contacto.css';

export default function Contacto() {
  const { settings } = useShopSettingsStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('none');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.first_name ? `${user.first_name} ${user.last_name_paternal || ''}`.trim() : '',
    email: user?.email || '',
    subject: '',
    message: ''
  });

  const handleWhatsApp = () => {
    // Si settings?.store_phone tiene un formato tipo "+591 70000000", limpiamos los espacios.
    const phone = settings?.store_phone?.replace(/\s+/g, '') || "+59157003312";
    const message = encodeURIComponent("Hola, me gustaría comunicarme con el equipo de VOXman.");
    window.open(`https://wa.me/${phone.replace('+', '')}?text=${message}`, '_blank');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const { sendContactMessage } = await import("../../../api/shop/contact");
      await sendContactMessage(formData);
      toast.success('¡Mensaje enviado correctamente! Te responderemos pronto.');
      setFormData(prev => ({ ...prev, subject: '', message: '' })); // Limpiamos solo mensaje
      setActiveTab('none');
    } catch (error) {
      if (!error.response || error.code === "ERR_NETWORK") {
        toast.error('No se pudo contactar al servidor. Revisa tu conexión.');
      } else {
        toast.error(error.response?.data?.message || 'Ocurrió un error al enviar el mensaje. Intenta de nuevo más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar isDarkThemeOverride={true} />
      
      <main className="contacto-page" style={{ flex: 1 }}>
        <div className="contacto-header">
          <h1>Centro de Contacto</h1>
          <p>
            ¿Tienes alguna duda, sugerencia o problema con un pedido? 
            Elige el método que mejor se adapte a ti y nos pondremos en contacto contigo lo antes posible.
          </p>
        </div>

        <div className="contacto-options">
          {/* Card WhatsApp */}
          <div className="contacto-card" onClick={handleWhatsApp}>
            <div className="contacto-icon">
              <MessageCircle size={28} />
            </div>
            <h3>Contacto Directo</h3>
            <p>Atención rápida y personalizada a través de nuestro canal oficial de WhatsApp.</p>
            <button className="contacto-btn">Ir a WhatsApp</button>
          </div>

          {/* Card Correo */}
          <div 
            className={`contacto-card ${activeTab === 'email' ? 'active' : ''}`} 
            onClick={() => setActiveTab(activeTab === 'email' ? 'none' : 'email')}
          >
            <div className="contacto-icon">
              <Mail size={28} />
            </div>
            <h3>Contacto a Soporte</h3>
            <p>Envíanos un mensaje detallado por correo y nuestro equipo de soporte te atenderá.</p>
            <button className="contacto-btn">
              {activeTab === 'email' ? 'Ocultar formulario' : 'Enviar un correo'}
            </button>
          </div>
        </div>

        {activeTab === 'email' && (
          <div className="contacto-form-container">
            <h2 style={{ marginBottom: '24px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }}>Formulario de Soporte</h2>
            <form onSubmit={handleSubmit}>
              <div className="contacto-form-group">
                <label>Nombre Completo</label>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Ej. Juan Pérez" 
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="contacto-form-group">
                <label>Correo Electrónico</label>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="tucorreo@ejemplo.com" 
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="contacto-form-group">
                <label>Asunto</label>
                <input 
                  type="text" 
                  name="subject" 
                  placeholder="Ej. Problema con mi pedido #12345" 
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="contacto-form-group">
                <label>Mensaje</label>
                <textarea 
                  name="message" 
                  placeholder="Describe detalladamente cómo podemos ayudarte..." 
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="submit" className="contacto-submit" disabled={loading}>
                {loading ? (
                  <><Loader2 size={18} className="spin" /> Enviando...</>
                ) : (
                  <><Send size={18} /> Enviar Mensaje</>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
