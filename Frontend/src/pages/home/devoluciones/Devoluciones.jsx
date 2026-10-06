import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../../../components/layout/Footer';
import { useAuthStore } from '../../../store/authStore';
import GuestLookup from './components/GuestLookup';
import AuthReturns from './components/AuthReturns';
import ReturnRequestForm from './components/ReturnRequestForm';
import { Link } from 'react-router-dom';
import './Devoluciones.css';

export default function Devoluciones() {
  const { user } = useAuthStore();
  const [guestSale, setGuestSale] = useState(null);
  const [guestPhone, setGuestPhone] = useState(null);

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
            Si no estás completamente satisfecho con tu compra, estamos aquí para ayudarte.
            Sigue los pasos a continuación para solicitar una devolución.
          </p>
        </div>

        <div className="devoluciones-content">
          {user ? (
            // Usuario Autenticado
            <AuthReturns />
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
