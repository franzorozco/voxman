import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../../../components/layout/Footer';
import { useAuthStore } from '../../../store/authStore';
import GuestLookup from './components/GuestLookup';
import AuthReturns from './components/AuthReturns';
import ReturnRequestForm from './components/ReturnRequestForm';
import { MailCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Devoluciones.css';

export default function Devoluciones() {
  const { user } = useAuthStore();
  const [guestSale, setGuestSale] = useState(null);
  const [guestPhone, setGuestPhone] = useState(null);

  const isEmailVerified = Boolean(user && (user.is_email_verified || user.email_verified_at || user.google_id));

  const handleGuestSaleFound = (sale, phone) => {
    setGuestSale(sale);
    setGuestPhone(phone);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main, #0d0d0d)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* We need to use the correct Navbar path. In Contacto it was ../../components/Navbar */}
      <Navbar isDarkThemeOverride={true} />

      <main className="devoluciones-page" style={{ flex: 1 }}>
        <div className="devoluciones-header">
          <h1>Centro de Devoluciones</h1>
          <p>
            Gestiona la devolución de tus prendas adquiridas. Recuerda que el plazo máximo es de <strong>1 día (24 horas)</strong> tras la entrega, la prenda debe estar <strong>sin uso y con su etiqueta original intacta</strong>, y se reembolsa el <strong>75% del valor</strong>.
          </p>
        </div>

        <div className="devoluciones-content">
          {user ? (
            // Usuario Autenticado
            !isEmailVerified ? (
              <div className="auth-returns-container email-verification-required">
                <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <MailCheck size={32} />
                  </div>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '10px' }}>Verificación de correo requerida</h2>
                  <p style={{ maxWidth: '520px', margin: '0 auto 25px', color: 'var(--text-muted)' }}>
                    Para poder tramitar solicitudes de devolución y enviarte el código de seguimiento y resolución oficial, es obligatorio que tu cuenta tenga su correo electrónico verificado.
                  </p>
                  <Link to="/profile" className="btn-lookup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', width: 'auto', padding: '12px 24px', margin: '0 auto' }}>
                    Ir a mi perfil para verificar correo
                  </Link>
                </div>
              </div>
            ) : (
              <AuthReturns />
            )
          ) : (
            // Usuario Invitado
            guestSale ? (
              <ReturnRequestForm 
                sale={guestSale} 
                guestPhone={guestPhone} 
                onBack={() => setGuestSale(null)}
                onReturnSuccess={() => setGuestSale(null)} // Opcional: mostrar un mensaje de éxito en su lugar
              />
            ) : (
              <div className="guest-options">
                <div className="guest-lookup-wrapper">
                  <GuestLookup onSaleFound={handleGuestSaleFound} />
                </div>
                <div className="guest-auth-prompt">
                  <h3>¿Tienes una cuenta?</h3>
                  <p>Inicia sesión para ver tu historial de compras y gestionar devoluciones más rápido.</p>
                  <Link to="/login" className="btn-login-prompt">Iniciar Sesión</Link>
                </div>
              </div>
            )
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
