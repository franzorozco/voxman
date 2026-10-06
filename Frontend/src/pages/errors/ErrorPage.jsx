import React from 'react';
import { Link } from 'react-router-dom';
import ErrorNavbar from './ErrorNavbar';
import Footer from '../../components/layout/Footer';

export default function ErrorPage({ code, title, description, actionText = "Volver al inicio", actionLink = "/", onAction }) {
  return (
    <div className="profile-theme" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main, #ffffff)', color: 'var(--text-main, #111827)' }}>
      <ErrorNavbar />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px', marginTop: '70px' }}>
        <h1 style={{ fontSize: '8rem', fontWeight: '800', margin: '0', color: 'var(--color-primary, #000000)', lineHeight: '1', letterSpacing: '-0.05em' }}>
          {code}
        </h1>
        <h2 style={{ fontSize: '2rem', fontWeight: '600', margin: '16px 0', letterSpacing: '-0.02em', color: 'var(--text-main, #111827)' }}>
          {title}
        </h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted, #6b7280)', maxWidth: '500px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
          {description}
        </p>
        
        {onAction ? (
          <button 
            onClick={onAction} 
            style={{ 
              padding: '14px 32px', 
              background: 'var(--text-main, #09090b)', 
              color: 'var(--bg-main, #ffffff)', 
              border: 'none',
              borderRadius: '30px', 
              fontWeight: '600', 
              fontSize: '1rem', 
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.8'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            {actionText}
          </button>
        ) : (
          <Link 
            to={actionLink} 
            style={{ 
              padding: '14px 32px', 
              background: 'var(--text-main, #09090b)', 
              color: 'var(--bg-main, #ffffff)', 
              textDecoration: 'none', 
              borderRadius: '30px', 
              fontWeight: '600', 
              fontSize: '1rem', 
              transition: 'opacity 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              display: 'inline-block'
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.8'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            {actionText}
          </Link>
        )}
      </div>

      <Footer />
    </div>
  );
}
